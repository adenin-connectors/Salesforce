'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let query = activity.Request.Query.query;
    if (query.length < 2) {
      let items = [];
      activity.Response.Data.items = items;
      return;
    }

    let url = `/v40.0/parameterizedSearch/?q=${query}&sobject=Case` +
      '&Case.fields=Id,Subject,Description';
    const response = await api(url);
    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = api.mapTicketsAndTasksToItems(response.body.searchRecords, "Case");
  } catch (error) {
    Activity.handleError(error);
  }
};