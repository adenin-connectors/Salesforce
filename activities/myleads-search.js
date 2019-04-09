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

    let url = `/v40.0/parameterizedSearch/?q=${query}&sobject=Lead` +
      '&Lead.fields=Id,FirstName,LastName';
    const response = await api(url);
    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = api.mapLeadsToItems(response.body.searchRecords);
  } catch (error) {
    Activity.handleError(error);
  }
};