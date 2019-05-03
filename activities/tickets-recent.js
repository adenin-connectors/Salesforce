'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = $.dateRange(activity, "today");
    api.initialize(activity);
    
    const response = await api.sendRequestWithPagination(`/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed 
    FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false`);
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