'use strict';
const api = require('./common/api');
const moment = require('moment-timezone');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const dateRange = $.dateRange(activity, 'today');

    const url = `/v40.0/query?q=SELECT Id,StartDateTime,EndDateTime,CreatedDate,Subject,Description,Location,OwnerId,DurationInMinutes,UndecidedEventInviteeIds,AcceptedEventInviteeIds,DeclinedEventInviteeIds FROM event WHERE StartDateTime > ${new Date(new Date().toUTCString()).toISOString()} AND StartDateTime <= ${dateRange.endDate} ORDER BY StartDateTime ASC`;
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
        date: new Date(raw.StartDateTime)
      };

      item.duration = moment.duration(moment(raw.EndDateTime).diff(moment(raw.StartDateTime))).humanize();

      const meetingUrl = parseUrl(raw.Location);

      if (meetingUrl) {
        item.onlineMeetingUrl = meetingUrl;
      } else {
        item.location = {
          title: raw.Location
        };
      }

      item.raw = raw;

      items.push(item);
    }

    activity.Response.Data.items = items;

    if (parseInt(pagination.page) === 1) {
      activity.Response.Data.title = T(activity, 'Events Today');
      activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Event/home`;
      activity.Response.Data.linkLabel = T(activity, 'All events');
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/salesforce.svg';
      activity.Response.Data.actionable = value > 0;
      activity.Response.Data.integration = 'Salesforce';

      if (value > 0) {
        const first = items[0];

        activity.Response.Data.value = value;
        activity.Response.Data.date = first.date;
        activity.Response.Data.description = value > 1 ? `You have ${value} events today.` : 'You have 1 event today';

        const when = moment().to(moment(first.date));

        activity.Response.Data.briefing = activity.Response.Data.description + ` The next is '${first.title}' ${when}`;
      } else {
        activity.Response.Data.description = T(activity, 'You have no events today.');
      }
    }

    activity.Response.Data._card = {
      type: 'events-today'
    };
  } catch (error) {
    $.handleError(activity, error);
  }
};

const urlRegex = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;

function parseUrl(text) {
  if (!text) return null;
  
  text = text.replace(/\n|\r/g, ' ');

  if (text.search(urlRegex) !== -1) {
    let url = text.substring(text.search(urlRegex), text.length);

    if (url.indexOf(' ') !== -1) url = url.substring(0, url.indexOf(' '));
    if (!url.match(/^[a-zA-Z]+:\/\//)) url = 'https://' + url;

    return url;
  }

  return null;
}
