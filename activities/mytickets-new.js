'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = $.dateRange(activity, "today");
    api.initialize(activity);
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM case 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    let tickets = [];
    if (response.body.records) {
      tickets = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: T(activity, 'New Tickets'),
      link: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      linkLabel: T(activity, 'All tickets')
    };

    let ticketCount = tickets.length;

    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: ticketCount > 1 ? T(activity, "You have {0} new tickets.", ticketCount) : T(activity, "You have 1 new ticket."),
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(activity, `You have no new tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};