'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var dateRange = $.dateRange(activity, "today");

    const response = await api.sendRequestWithPagination(`/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed 
    FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND IsClosed = false`);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapObjectsToItems(response.body.records, "Case");
    let value = activity.Response.Data.items.items.length;
    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'Open Tickets');
    activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Case/list`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
    activity.Response.Data.actionable = value > 0;

    if (value > 0) {
      activity.Response.Data.value = value;
      activity.Response.Data.color = 'blue';
      activity.Response.Data.description = value > 1 ? T(activity, "You have {0} tickets.", value)
        : T(activity, "You have 1 ticket.");
    } else {
      activity.Response.Data.description = T(activity, `You have no tickets.`);
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};