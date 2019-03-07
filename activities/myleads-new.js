'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    var dateRange = cfActivity.dateRange(activity, "today");
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM lead WHERE CreatedDate > ${dateRange.startDate}`);

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let leads = [];
    if (response.body.records) {
      leads = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let leadsStatus = {
      title: 'New Leads',
      url: `https://${salesforceDomain}/lightning/o/Lead/list`,
      urlLabel: 'All Leads',
    };

    let leadsCount = leads.length;

    if (leadsCount != 0) {
      leadsStatus = {
        ...leadsStatus,
        description: `You have ${leadsCount > 1 ? leadsCount + " new leads" : leadsCount + " new lead"}.`,
        color: 'blue',
        value: leadsCount,
        actionable: true
      };
    } else {
      leadsStatus = {
        ...leadsStatus,
        description: `You have no new leads.`,
        actionable: false
      };
    }

    activity.Response.Data = leadsStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};