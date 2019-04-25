'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = $.dateRange(activity, "today");
    api.initialize(activity);
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM task 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}`);

    if ($.isErrorResponse(activity, response)) return;

    let tasks = [];
    if (response.body.records) {
      tasks = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: T(activity, 'New Tasks'),
      link: `https://${salesforceDomain}/lightning/o/Task/home`,
      linkLabel: T(activity, 'All Tasks')
    };

    let taskCount = tasks.length;

    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: taskCount > 1 ? T(activity, "You have {0} new tasks.", taskCount) : T(activity, "You have 1 new task."),
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: T(activity, `You have no new tasks.`),
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};