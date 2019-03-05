'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api('/v26.0/sobjects/task');

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let tasks = [];
    if (response.body.recentItems) {
      tasks = response.body.recentItems;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: 'Active Tasks',
      url: `https://${salesforceDomain}/lightning/o/Task/home`,
      urlLabel: 'All tasks',
    };

    let taskCount = tasks.length;

    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: `You have ${taskCount > 1 ? taskCount + " tasks" : taskCount + " task"}.`,
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: `You have no tasks.`,
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};