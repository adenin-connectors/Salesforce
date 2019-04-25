'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let url = `/v40.0/query?q=SELECT Id,FirstName,LastName FROM lead`;
    api.initialize(activity);
    const response = await api.sendRequestWithPagination(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data = api.mapLeadsToItems(response.body.records);
  } catch (error) {
    $.handleError(activity, error);
  }
};