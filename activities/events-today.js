'use strict';
const api = require('./common/api');
const moment = require('moment-timezone');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const dateRange = $.dateRange(activity, 'today');

    const url = `/v40.0/query?q=SELECT Id,StartDateTime,CreatedDate,Subject,Description,Location,OwnerId,DurationInMinutes,UndecidedEventInviteeIds,AcceptedEventInviteeIds,DeclinedEventInviteeIds FROM event WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} AND StartDateTime <= ${dateRange.endDate} ORDER BY StartDateTime ASC`;
    const valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM event WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} AND StartDateTime <= ${dateRange.endDate}`;

    const promises = [];

    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }

    const events = responses[0].body.records;
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);

    const items = [];

    for (let i = 0; i < events.length; i++) {
      const raw = events[i];

      const item = {
        id: raw.Id,
        title: raw.Subject,
        description: raw.Description,
        link: `https://${api.getDomain()}/lightning/r/Event/${raw.Id}/view`,
        date: new Date(raw.StartDateTime),
        duration: raw.DurationInMinutes,
        location: raw.Location,
        raw: raw
      };

      items.push(item);
    }

    activity.Response.Data.items = items;

    if (parseInt(pagination.page) === 1) {
      activity.Response.Data.title = T(activity, 'Events Today');
      activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Event/home`;
      activity.Response.Data.linkLabel = T(activity, 'All events');
      activity.Response.Data.actionable = value > 0;

      const first = items[0];

      if (value > 0 && first) {
        const eventFormatedTime = getEventFormatedTimeAsString(activity, first);
        const eventPluralorNot = value > 1 ? T(activity, 'events scheduled') : T(activity, 'event scheduled');
        const description = T(activity, 'You have {0} {1} today. The next event \'{2}\' starts {3}', value, eventPluralorNot, first.Subject, eventFormatedTime);

        activity.Response.Data.value = value;
        activity.Response.Data.date = first.date;
        activity.Response.Data.description = description;
        activity.Response.Data.briefing = description;
      } else {
        activity.Response.Data.description = T(activity, 'You have no events today.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};

//** checks if event is in less then hour, today or tomorrow and returns formated string accordingly */
function getEventFormatedTimeAsString(activity, nextEvent) {
  const eventTime = moment(nextEvent.StartDateTime).tz(activity.Context.UserTimezone);
  const timeNow = moment(new Date());

  const diffInHrs = eventTime.diff(timeNow, 'hours');

  if (diffInHrs === 0) {
    //events that start in less then 1 hour
    const diffInMins = eventTime.diff(timeNow, 'minutes');
    return T(activity, 'in {0} minutes.', diffInMins);
  } else {
    //events that start in more than 1 hour
    const diffInDays = eventTime.diff(timeNow, 'days');

    let datePrefix = '';
    let momentDate = '';

    if (diffInDays === 1) {
      //events that start tomorrow
      datePrefix = 'tomorrow ';
    } else if (diffInDays > 1) {
      //events that start day after tomorrow and later
      datePrefix = 'on ';
      momentDate = eventTime.format('LL') + ' ';
    }

    return T(activity, '{0}{1}{2}{3}.', T(activity, datePrefix), momentDate, T(activity, 'at '), eventTime.format('LT'));
  }
}
