'use strict';
const api = require('./common/api');
const moment = require('moment-timezone');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    var dateRange = $.dateRange(activity, "today");
    let url = `/v26.0/query?q=SELECT Id,StartDateTime,CreatedDate,Subject,Description FROM event
    WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} AND StartDateTime <= ${dateRange.endDate} ORDER BY StartDateTime ASC`;
    
    let valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM event WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} 
    AND StartDateTime <= ${dateRange.endDate}`;
    const promises = [];
    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));
    const responses = await Promise.all(promises);
  
    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }
    const events = responses[0];
    const value = responses[1].body.records[0].expr0;

    activity.Response.Data.items = api.mapObjectsToItems(events.body.records, "Event");
    activity.Response.Data.title = T(activity, 'Events Today');
    activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Event/home`;
    activity.Response.Data.linkLabel = T(activity, 'All events');
    activity.Response.Data.actionable = value > 0;

    let nextEvent = events.body.records[0];
    if (value > 0 && nextEvent) {
      let eventFormatedTime = getEventFormatedTimeAsString(activity, nextEvent);
      let eventPluralorNot = value > 1 ? T(activity, "events scheduled") : T(activity, "event scheduled");
      let description = T(activity, `You have {0} {1} today. The next event '{2}' starts {3}`, value, eventPluralorNot, nextEvent.Subject, eventFormatedTime);

      activity.Response.Data.value = value;
      activity.Response.Data.date = activity.Response.Data.items[0].date;
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