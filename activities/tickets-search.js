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

    api.initialize(activity);
    let url = `/v40.0/parameterizedSearch/?q=${query}&sobject=Case` +
      '&Case.fields=Id,Subject,Description,CreatedDate,IsClosed&Case.where=IsClosed=false';
    const response = await api(url);
    if ($.isErrorResponse(activity, response)) return;

    activity.Response.Data.items = api.mapObjectsToItems(response.body.searchRecords, "Case");
    
    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'Open Tickets');
    activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Case/list?filterName=Recent`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};