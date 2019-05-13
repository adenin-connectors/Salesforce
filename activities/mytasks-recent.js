'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = $.dateRange(activity, "today");
    api.initialize(activity);
    const currentUser = await api('/v24.0/chatter/users/me');
    if ($.isErrorResponse(activity, currentUser)) return;

    const response = await api(`/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed 
    FROM task WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}
    AND OwnerId = '${currentUser.body.id}' AND IsClosed = false`);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapObjectsToItems(response.body.records, "Task");

    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'Active Tasks');
    activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Task/home`;
    activity.Response.Data.linkLabel = T(activity, 'All Tasks');
  } catch (error) {
    $.handleError(activity, error);
  }
};