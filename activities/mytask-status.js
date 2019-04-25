'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api('/v26.0/sobjects/task');

    if ($.isErrorResponse(activity, response)) return;

    let tasks = [];
    if (response.body.recentItems) {
      tasks = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: T(activity, 'Active Tasks'),
      link: `https://${salesforceDomain}/lightning/o/Task/home`,
      linkLabel: T(activity, 'All Tasks')
    };

    let taskCount = tasks.length;

    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: taskCount > 1 ? T(activity, "You have {0} tasks.", taskCount) : T(activity, "You have 1 task."),
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: T(activity, `You have no tasks.`),
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    $.handleError(activity, error);
  }
};