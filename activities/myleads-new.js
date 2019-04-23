'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = $.dateRange(activity, "today");
    api.initialize(activity);
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM lead 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.startDate}`);

    if ($.isErrorResponse(activity, response)) return;

    let leads = [];
    if (response.body.records) {
      leads = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let leadsStatus = {
      title: T(activity, 'New Leads'),
      link: `https://${salesforceDomain}/lightning/o/Lead/list`,
      linkLabel: T(activity, 'All Leads')
    };

    let leadsCount = leads.length;

    if (leadsCount != 0) {
      leadsStatus = {
        ...leadsStatus,
        description: leadsCount > 1 ? T(activity, "You have {0} new leads.", leadsCount) : T(activity, "You have 1 new lead."),
        color: 'blue',
        value: leadsCount,
        actionable: true
      };
    } else {
      leadsStatus = {
        ...leadsStatus,
        description: T(activity, `You have no new leads.`),
        actionable: false
      };
    }

    activity.Response.Data = leadsStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};