'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    let currentUserData = await api("/v24.0/chatter/users/me");
    if ($.isErrorResponse(activity, currentUserData)) return;

    var dateRange = $.dateRange(activity);
    let url = `/v40.0/query?q=SELECT Id,FirstName,LastName,CreatedDate FROM lead ` +
      `WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} and ` +
      `OwnerId = '${currentUserData.body.id}' ORDER BY CreatedDate DESC`;
    let valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM lead ` +
      `WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} and OwnerId = '${currentUserData.body.id}'`;

    const promises = [];
    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));
    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }

    const leads = responses[0].body.records;
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);
    activity.Response.Data.items = api.mapLeadsToItems(leads);

    if (parseInt(pagination.page) == 1) {
    let salesforceDomain = api.getDomain();
      activity.Response.Data.title = T(activity, 'Active Leads');
      activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Lead/list`;
      activity.Response.Data.linkLabel = T(activity, 'All Leads');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = value > 1 ? T(activity, "You have {0} leads.", value)
          : T(activity, "You have 1 lead.");
      } else {
        activity.Response.Data.description = T(activity, `You have no leads.`);
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};