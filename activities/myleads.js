'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let url = `/v40.0/query?q=SELECT Id,FirstName,LastName FROM lead`;
    const response = await api.sendRequestWithPagination(url);
    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = api.mapLeadsToItems(response.body.records);
  } catch (error) {
    Activity.handleError(error);
  }
};