'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    api.initialize(activity);

    const response = await api('/v40.0/query?q=SELECT Priority,IsClosed FROM case WHERE IsClosed = false');

    if ($.isErrorResponse(activity, response)) return;

    const tickets = response.body.records;
    const chartDefinition = createChartDefinition(tickets);

    activity.Response.Data.chart = chartDefinition;
    activity.Response.Data.title = T(activity, 'Open Tickets by Priority');
    activity.Response.Data.link = `https://${api.getDomain()}/lightning/o/Case/list`;
    activity.Response.Data.linkLabel = T(activity, 'All Tickets');
  } catch (error) {
    $.handleError(activity, error);
  }
};

//** maps response data to data format usable by chart */
function createChartDefinition(tickets) {
  const priorities = [];
  const datasets = [];
  const data = [];

  for (let i = 0; i < tickets.length; i++) {
    const priority = tickets[i].Priority ? tickets[i].Priority : 'No Priority';

    if (!priorities.includes(priority)) priorities.push(priority);
  }

  for (let x = 0; x < priorities.length; x++) {
    let counter = 0;

    for (let y = 0; y < tickets.length; y++) {
      const status = tickets[y].Priority ? tickets[y].Priority : 'No Priority';

      if (priorities[x] === status) counter++;
    }

    data.push(counter);
  }

  datasets.push({
    label: 'Number Of Tickets',
    data
  });

  const chart = {
    configuration: {
      data: {
        labels: priorities,
        datasets: datasets
      },
      options: {
        title: {
          display: true,
          text: 'Open Tickets by Priority'
        }
      }
    },
    template: 'pie-labels'
  };

  return chart;
}
