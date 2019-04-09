'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let url = `/v40.0/parameterizedSearch/?q=${activity.Request.Query.query}&sobject=Case` +
      '&Case.fields=Id,Subject,Description';
    const response = await api(url);
    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = api.mapTicketsAndTasksToItems(response.body.searchRecords,"Case");
  } catch (error) {
    Activity.handleError(error);
  }
};