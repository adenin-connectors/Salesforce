'use strict';
const api = require('./common/api');
const moment = require('moment-timezone');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    var dateRange = $.dateRange(activity, "today");
    const limit = 1;
    let allEvents = [];
    let url = `/v26.0/query?q=SELECT Id,StartDateTime,CreatedDate,Subject,Description FROM event
    WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} AND StartDateTime <= ${dateRange.endDate} ORDER BY StartDateTime ASC LIMIT ${limit}`;
    const response = await api(url);
    if ($.isErrorResponse(activity, response)) return;
    allEvents.push(...response.body.records);

    let nextQueryDate = null;
    if (response.body.records.length == limit) {
      nextQueryDate = response.body.records[response.body.records.length - 1].StartDateTime;
    }

    while (nextQueryDate) {
      let nextPageUrl = `/v26.0/query?q=SELECT Id,StartDateTime,CreatedDate,Subject,Description FROM event
      WHERE StartDateTime > ${new Date(nextQueryDate).toISOString()} AND StartDateTime <= ${dateRange.endDate} ORDER BY StartDateTime ASC LIMIT ${limit}`;
      const nextPage = await api(nextPageUrl);
      if ($.isErrorResponse(activity, nextPage)) return;
      allEvents.push(...nextPage.body.records);

      nextQueryDate = null;
      if (nextPage.body.records.length == limit) {
        nextQueryDate = nextPage.body.records[nextPage.body.records.length - 1].StartDateTime;
      }
    }

    let value = allEvents.length;
    let pagination = $.pagination(activity);
    let pagiantedItems = paginateItems(allEvents, pagination);

    activity.Response.Data.items = api.mapObjectsToItems(pagiantedItems, "Event");
    activity.Response.Data.title = T(activity, 'Events Today');
    activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Event/home`;
    activity.Response.Data.linkLabel = T(activity, 'All events');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      let nextEvent = allEvents[0];

      let eventFormatedTime = getEventFormatedTimeAsString(activity, nextEvent);
      let eventPluralorNot = value > 1 ? T(activity, "events scheduled") : T(activity, "event scheduled");
      let description = T(activity, `You have {0} {1} today. The next event '{2}' starts {3}`, value, eventPluralorNot, nextEvent.Subject, eventFormatedTime);

      activity.Response.Data.value = value;
      activity.Response.Data.color = 'blue';
      activity.Response.Data.description = description;
    } else {
      activity.Response.Data.description = T(activity, `You have no events today.`);
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
//** checks if event is in less then hour, today or tomorrow and returns formated string accordingly */
function getEventFormatedTimeAsString(activity, nextEvent) {
  let eventTime = moment(nextEvent.StartDateTime)
    .tz(activity.Context.UserTimezone)
    .locale(activity.Context.UserLocale);
  let timeNow = moment(new Date());

  let diffInHrs = eventTime.diff(timeNow, 'hours');

  if (diffInHrs == 0) {
    //events that start in less then 1 hour
    let diffInMins = eventTime.diff(timeNow, 'minutes');
    return T(activity, `in {0} minutes.`, diffInMins);
  } else {
    //events that start in more than 1 hour
    let diffInDays = eventTime.diff(timeNow, 'days');

    let datePrefix = '';
    let momentDate = '';
    if (diffInDays == 1) {
      //events that start tomorrow
      datePrefix = 'tomorrow ';
    } else if (diffInDays > 1) {
      //events that start day after tomorrow and later
      datePrefix = 'on ';
      momentDate = eventTime.format('LL') + " ";
    }

    return T(activity, `{0}{1}{2}{3}.`, T(activity, datePrefix), momentDate, T(activity, "at "), eventTime.format('LT'));
  }
}
//** paginate items[] based on provided pagination */
function paginateItems(items, pagination) {
  let pagiantedItems = [];
  const pageSize = parseInt(pagination.pageSize);
  const offset = (parseInt(pagination.page) - 1) * pageSize;

  if (offset > items.length) return pagiantedItems;

  for (let i = offset; i < offset + pageSize; i++) {
    if (i >= items.length) {
      break;
    }
    pagiantedItems.push(items[i]);
  }
  return pagiantedItems;
}