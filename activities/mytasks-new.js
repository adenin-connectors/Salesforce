'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);
    var dateRange = cfActivity.dateRange(activity, "today");
    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM task WHERE CreatedDate > ${dateRange.startDate}`);

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    let tasks = [];
    if (response.body.records) {
      tasks = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: 'New Tasks',
      url: `https://${salesforceDomain}/lightning/o/Task/home`,
      urlLabel: 'All tasks',
    };

    let taskCount = tasks.length;

    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: `You have ${taskCount > 1 ? taskCount + " new tasks" : taskCount + " new task"}.`,
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: `You have no new tasks.`,
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};