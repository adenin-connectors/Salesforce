'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api(`/v40.0/query?q=SELECT IsClosed FROM case WHERE IsClosed = false`);
    if ($.isErrorResponse(activity, response)) return;

    let tickets = [];
    if (response.body.records) {
      tickets = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let status = {
      title: T(activity, 'Open Tickets'),
      link: `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`,
      linkLabel: T(activity, 'All tickets')
    };

    let value = tickets.length;

    if (value != 0) {
      status = {
        ...status,
        description: value > 1 ? T(activity, "You have {0} tickets.", value) : T(activity, "You have 1 ticket."),
        color: 'blue',
        value: value,
        actionable: true
      };
    } else {
      status = {
        ...status,
        description: T(activity, `You have no tickets.`),
        actionable: false
      };
    }

    activity.Response.Data = status;
  } catch (error) {
    $.handleError(activity, error);
  }
};