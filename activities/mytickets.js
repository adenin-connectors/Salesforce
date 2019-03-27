'use strict';
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    let url = `/v40.0/query?q=SELECT Id,Subject,Description FROM case`;
    const response = await api.sendRequestWithPagination(url);

    if (Activity.isErrorResponse(response)) return;

    activity.Response.Data = mapResponseToItems(response);
  } catch (error) {
    Activity.handleError(error);
  }
};

//**maps response to items */
function mapResponseToItems(response) {
  let items = [];
  let tasks = response.body.records;

  let salesforceDomain = api.getDomain();

  for (let i = 0; i < tasks.length; i++) {
    let raw = tasks[i];

    let item = {
      id: raw.Id,
      title: raw.Subject,
      description: raw.Description,
      link: `https://${salesforceDomain}//lightning/r/Case/${raw.Id}/view`,
      raw: raw
    };
    items.push(item);
  }

  return { items: items };
}