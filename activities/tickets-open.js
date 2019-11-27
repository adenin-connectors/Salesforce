'use strict';

const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const dateRange = $.dateRange(activity);

    const url = `/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,Status,Reason,SuppliedName,SuppliedCompany,SuppliedEmail  FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false ORDER BY CreatedDate DESC`;
    const valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false`;

    const promises = [];

    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }

    const tickets = responses[0];
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);

    activity.Response.Data.items = api.mapObjectsToItems(tickets.body.records, 'Case');

    if (parseInt(pagination.page) === 1) {
      const salesforceDomain = api.getDomain();

      activity.Response.Data.title = T(activity, 'Open Tickets');
      activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Case/list`;
      activity.Response.Data.linkLabel = T(activity, 'All Tickets');
      activity.Response.Data.actionable = value > 0;
      activity.Response.Data.thumbnail = 'https://www.adenin.com/assets/images/wp-images/logo/salesforce.svg';

      if (value > 0) {
        const first = activity.Response.Data.items[0];

        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.description = value > 1 ? T(activity, 'You have {0} open tickets.', value) : T(activity, 'You have 1 open ticket.');

        let fallbackToDefault = false;

        // For the briefing message we first try company name, then creator's name, then creator's email, before falling back to default
        if (first.raw.SuppliedCompany) {
          activity.Response.Data.briefing = first.raw.SuppliedCompany;
        } else if (first.raw.SuppliedName) {
          activity.Response.Data.briefing = first.raw.SuppliedName;
        } else if (first.raw.SuppliedEmail) {
          activity.Response.Data.briefing = first.raw.SuppliedEmail;
        } else {
          // default is we append latest ticket name to the existing ticket count message
          activity.Response.Data.briefing = activity.Response.Data.description + ` The latest is <strong>${first.title}</strong>`;
          fallbackToDefault = true;
        }

        // if we aren't using default message, we add the rest of the text that is common to briefing message here
        if (!fallbackToDefault) {
          activity.Response.Data.briefing += ` has an open ticket for <b>${first.title}</b>`;

          // if there's more than one ticket we add 'and X more', then must check if there's more than two tickets (to decide whether to use plural)
          if (value > 1) activity.Response.Data.briefing += value > 2 ? `, along with ${value - 1} more open tickets` : ', along with 1 more open ticket';
        }
      } else {
        activity.Response.Data.description = T(activity, 'You have no open tickets.');
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};
