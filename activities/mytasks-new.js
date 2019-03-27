'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    var dateRange = Activity.dateRange("today");

    const response = await api(`/v26.0/query?q=SELECT CreatedDate FROM task 
    WHERE CreatedDate > ${dateRange.startDate} AND CreatedDate < ${dateRange.endDate}`);

    if (Activity.isErrorResponse(response)) return;

    let tasks = [];
    if (response.body.records) {
      tasks = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let taskStatus = {
      title: T('New Tasks'),
      url: `https://${salesforceDomain}/lightning/o/Task/home`,
      urlLabel: T('All Tasks')
    };

    let taskCount = tasks.length;

    if (taskCount != 0) {
      taskStatus = {
        ...taskStatus,
        description: taskCount > 1 ? T("You have {0} new tasks.", taskCount) : T("You have 1 new task."),
        color: 'blue',
        value: taskCount,
        actionable: true
      };
    } else {
      taskStatus = {
        ...taskStatus,
        description: T(`You have no new tasks.`),
        actionable: false
      };
    }

    activity.Response.Data = taskStatus;
  } catch (error) {
    Activity.handleError(error);
  }
};