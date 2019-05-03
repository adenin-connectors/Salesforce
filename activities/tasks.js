'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    let url = `/v40.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed FROM task WHERE IsClosed = false`;
    const response = await api.sendRequestWithPagination(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapTicketsAndTasksToItems(response.body.records, "Task");

    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'Active Tasks');
    activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Task/home`;
    activity.Response.Data.linkLabel = T(activity, 'All Tasks');
  } catch (error) {
    $.handleError(activity, error);
  }
};