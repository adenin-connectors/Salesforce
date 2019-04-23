'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    const response = await api('/v26.0/query?q=SELECT FirstName FROM lead');

    if ($.isErrorResponse(activity, response)) return;

    let leads = [];
    if (response.body.recentItems) {
      leads = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let leadsStatus = {
      title: T(activity, 'Active Leads'),
      link: `https://${salesforceDomain}/lightning/o/Lead/list`,
      linkLabel: T(activity, 'All Leads')
    };

    let leadsCount = leads.length;

    if (leadsCount != 0) {
      leadsStatus = {
        ...leadsStatus,
        description: leadsCount > 1 ? T(activity, "You have {0} leads.", leadsCount) : T(activity, "You have 1 lead."),
        color: 'blue',
        value: leadsCount,
        actionable: true
      };
    } else {
      leadsStatus = {
        ...leadsStatus,
        description: T(activity, `You have no leads.`),
        actionable: false
      };
    }

    activity.Response.Data = leadsStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};