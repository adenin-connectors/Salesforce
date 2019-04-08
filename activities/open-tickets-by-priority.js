'use strict';
const api = require('./common/api');

module.exports = async (activity) => {
  try {
    const response = await api(`/v40.0/query?q=SELECT Priority FROM case`);

    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = mapResponseToChartData(response);
  } catch (error) {
    Activity.handleError(error);
  }
};
//** maps response data to data format usable by chart */
function mapResponseToChartData(response) {
  let tickets = response.body.records;
  let priorities = [];
  let datasets = [];
  let data = [];

  for (let i = 0; i < tickets.length; i++) {
    let priority = tickets[i].Priority ? tickets[i].Priority : "No Priority";
    if (!priorities.includes(priority)) {
      priorities.push(priority);
    }
  }

  for (let x = 0; x < priorities.length; x++) {
    let counter = 0;
    for (let y = 0; y < tickets.length; y++) {
      let status = tickets[y].Priority ? tickets[y].Priority : "No Priority";
      if (priorities[x] == status) {
        counter++;
      }
    }
    data.push(counter);
  }
  datasets.push({ label: 'Number Of Tickets', data });

  let chartData = {
    chart: {
      configuration: {
        data: {},
        options: {
          title: {
            display: true,
            text: 'Ticket Metrics By Priority'
          }
        }
      },
      template: 'bar',
      palette: 'office.Office6'
    },
    _settings: {}
  };
  chartData.chart.configuration.data.labels = priorities;
  chartData.chart.configuration.data.datasets = datasets;

  return chartData;
}