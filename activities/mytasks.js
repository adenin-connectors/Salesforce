'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);
    const currentUser = await api('/v24.0/chatter/users/me');
    if ($.isErrorResponse(activity, currentUser)) return;
    var dateRange = $.dateRange(activity);

    let url = `/v26.0/query?q=SELECT Id,Subject,Description,OwnerId,CreatedDate,IsClosed 
    FROM task WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND 
    IsClosed = false AND OwnerId = '${currentUser.body.id}' ORDER BY CreatedDate DESC`;

    let valueUrl = `/v40.0/query?q=SELECT COUNT(Id) FROM task 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate} AND 
    IsClosed = false AND OwnerId = '${currentUser.body.id}'`;

    const promises = [];
    promises.push(api.sendRequestWithPagination(url));
    promises.push(api(valueUrl));
    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      if ($.isErrorResponse(activity, responses[i])) return;
    }
    const tasks = responses[0];
    const value = responses[1].body.records[0].expr0;

    const pagination = $.pagination(activity);
    activity.Response.Data.items = api.mapObjectsToItems(tasks.body.records, "Task");

    if (parseInt(pagination.page) == 1) {
      let salesforceDomain = api.getDomain();
      activity.Response.Data.title = T(activity, 'Active Tasks');
      activity.Response.Data.link = `https://${salesforceDomain}/lightning/o/Task/home`;
      activity.Response.Data.linkLabel = T(activity, 'All Tasks');
      activity.Response.Data.actionable = value > 0;

      if (value > 0) {
        activity.Response.Data.value = value;
        activity.Response.Data.date = activity.Response.Data.items[0].date;
        activity.Response.Data.color = 'blue';
        activity.Response.Data.description = value > 1 ? T(activity, "You have {0} tasks.", value)
          : T(activity, "You have 1 task.");
      } else {
        activity.Response.Data.description = T(activity, `You have no tasks.`);
      }
    }
  } catch (error) {
    $.handleError(activity, error);
  }
};