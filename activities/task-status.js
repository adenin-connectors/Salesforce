'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api(`/v40.0/query?q=SELECT IsClosed FROM task WHERE IsClosed = false`);
    if ($.isErrorResponse(activity, response)) return;

    let tasks = [];
    if (response.body.records) {
      tasks = response.body.records;
    }

    let salesforceDomain = api.getDomain();

    let status = {
      title: T(activity, 'Active Tasks'),
      link: `https://${salesforceDomain}/lightning/o/Task/home`,
      linkLabel: T(activity, 'All Tasks')
    };

    let value = tasks.length;

    if (value != 0) {
      status = {
        ...status,
        description: value > 1 ? T(activity, "You have {0} tasks.", value) : T(activity, "You have 1 task."),
        color: 'blue',
        value: value,
        actionable: true
      };
    } else {
      status = {
        ...status,
        description: T(activity, `You have no tasks.`),
        actionable: false
      };
    }

    activity.Response.Data = status;
  } catch (error) {
    $.handleError(activity, error);
  }
};