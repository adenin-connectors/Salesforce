'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    if (!activity.Request.Query.query) activity.Request.Query.query = "";

    let query = activity.Request.Query.query;
    if (query.length < 2) {
      let items = [];
      activity.Response.Data.items = items;
      return;
    }

    let url = `/v40.0/parameterizedSearch/?q=${query}&sobject=Lead` +
      '&Lead.fields=Id,FirstName,LastName';
    api.initialize(activity);
    const response = await api(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data = api.mapLeadsToItems(response.body.searchRecords);
  } catch (error) {
    $.handleError(activity, error);
  }
};