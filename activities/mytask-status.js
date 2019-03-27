'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api('/v26.0/sobjects/task');

    if (Activity.isErrorResponse(response)) return;

    let tasks = [];
    if (response.body.recentItems) {
      tasks = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: T('Active Tasks'),
      url: `https://${salesforceDomain}/lightning/o/Task/home`,
      urlLabel: T('All Tasks')
    };

    let taskCount = tasks.length;
    
    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: taskCount > 1 ? T("You have {0} tasks.", taskCount) : T("You have 1 task."),
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: T(`You have no tasks.`),
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};