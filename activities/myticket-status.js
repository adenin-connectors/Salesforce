'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api('/v26.0/sobjects/case');

    if ($.isErrorResponse(activity, response)) return;

    let tickets = [];
    if (response.body.recentItems) {
      tickets = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: T(activity, 'Open Tickets'),
      link: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      linkLabel: T(activity, 'All tickets')
    };

    let ticketCount = tickets.length;

    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: ticketCount > 1 ? T(activity, "You have {0} tickets.", ticketCount) : T(activity, "You have 1 ticket."),
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(activity, `You have no tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};