'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let url = `/v40.0/query?q=SELECT Id,Subject,Description FROM case`;
    const response = await api.sendRequestWithPagination(url);
    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = api.mapTicketsAndTasksToItems(response.body.records,"Case");
  } catch (error) {
    Activity.handleError(error);
  }
};