'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    var dateRange = $.dateRange(activity, "today");
    let url = `/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed 
    FROM case WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}`;

    let valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM case WHERE CreatedDate > ${dateRange.startDate} 
    AND CreatedDate < ${dateRange.endDate}`;
    const promises = [];
    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));
    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }
    const tickets = responses[0];
    const value = responses[1].body.records[0].expr0;

    activity.Response.Data.items = api.mapObjectsToItems(tickets.body.records, "Case");
    let salesforceDomain = api.getDomain();
    activity.Response.Data.title = T(activity, 'All Tickets');
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