'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
  var dateRange = Activity.dateRange("today");

    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM case 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}`);

    if (Activity.isErrorResponse(response)) return;

    let tickets = [];
    if (response.body.records) {
      tickets = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: T('New Tickets'),
      link: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      linkLabel: T('All tickets')
    };

    let ticketCount = tickets.length;

    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: ticketCount > 1 ? T("You have {0} new tickets.", ticketCount) : T("You have 1 new ticket."),
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: T(`You have no new tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};