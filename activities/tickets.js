'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    const currentUser = await api('/v24.0/chatter/users/me');
    if ($.isErrorResponse(activity, currentUser)) return;

    let url = `/v40.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed FROM case WHERE IsClosed = false`;

    const response = await api.sendRequestWithPagination(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapTicketsAndTasksToItems(response.body.records, "Case");

    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'Open Tickets');
    activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};