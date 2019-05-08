'use strict';
const api = require('./common/api');
const moment = require('moment-timezone');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    var dateRange = $.dateRange(activity, "today");
    const response = await api.sendRequestWithPagination(`/v26.0/query?q=SELECT Id,StartDateTime,CreatedDate,Subject,Description FROM event
     WHERE StartDateTime > ${dateRange.startDate} AND StartDateTime <= ${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapObjectsToItems(response.body.records,"Event");
    let value = activity.Response.Data.items.items.length;
    activity.Response.Data.title = T(activity, 'Events Today');
    activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Event/home`;
    activity.Response.Data.linkLabel = T(activity, 'All events');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      let nextEvent = getNexEvent(response.body.records);

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
/**filters out first upcoming event in google calendar*/
function getNexEvent(events) {
  let nextEvent = null;
  let nextEventMilis = 0;

  for (let i = 0; i < events.length; i++) {
    let tempDate = Date.parse(events[i].StartDateTime);

    if (nextEventMilis == 0) {
      nextEventMilis = tempDate;
      nextEvent = events[i];
    }

    if (nextEventMilis > tempDate) {
      nextEventMilis = tempDate;
      nextEvent = events[i];
    }
  }

  return nextEvent;
}

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
    return T(activity,`in {0} minutes.`, diffInMins);
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

    return T(activity,`{0}{1}{2}{3}.`, T(activity,datePrefix), momentDate, T(activity,"at "), eventTime.format('LT'));
  }
}