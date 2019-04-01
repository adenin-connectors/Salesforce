'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api('/v26.0/sobjects/case');

    if (Activity.isErrorResponse(response)) return;

    let tickets = [];
    if (response.body.recentItems) {
      tickets = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: T('Open Tickets'),
      link: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      linkLabel: T('All tickets')
    };

    let ticketCount = tickets.length;
    
    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: ticketCount > 1 ? T("You have {0} tickets.", ticketCount) : T("You have 1 ticket."),
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(`You have no tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};