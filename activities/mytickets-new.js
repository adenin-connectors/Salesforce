'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    var dateRange = cfActivity.dateRange(activity, "today");
    
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM case 
    WHERE CreatedDate > ${dateRange.startDate} & CreatedDate < ${dateRange.endDate}`);

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let tickets = [];
    if (response.body.records) {
      tickets = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let ticketStatus = {
      title: 'Active Tickets',
      url: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      urlLabel: 'All tickets',
    };

    let ticketCount = tickets.length;

    if (ticketCount != 0) {
      ticketStatus = {
        ...ticketStatus,
        description: `You have ${ticketCount > 1 ? ticketCount + " new tickets" : ticketCount + " new ticket"}.`,
        color: 'blue',
        value: ticketCount,
        actionable: true
      };
    } else {
      ticketStatus = {
        ...ticketStatus,
        description: `You have no new tickets.`,
        actionable: false
      };
    }

    activity.Response.Data = ticketStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};