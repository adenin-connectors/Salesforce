'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api('/v26.0/query?q=SELECT FirstName FROM lead');

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let leads = [];
    if (response.body.recentItems) {
      leads = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let leadsStatus = {
      title: 'Active Leads',
      url: `https://${salesforceDomain}/lightning/o/Lead/list`,
      urlLabel: 'All Leads',
    };

    let leadsCount = leads.length;

    if (leadsCount != 0) {
      leadsStatus = {
        ...leadsStatus,
        description: `You have ${leadsCount > 1 ? leadsCount + " leads" : leadsCount + " lead"}.`,
        color: 'blue',
        value: leadsCount,
        actionable: true
      };
    } else {
      leadsStatus = {
        ...leadsStatus,
        description: `You have no leads.`,
        actionable: false
      };
    }

    activity.Response.Data = leadsStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};