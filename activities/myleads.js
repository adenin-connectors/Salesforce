'use strict';
const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    let url = `/v40.0/query?q=SELECT Id,FirstName,LastName FROM lead`;
    const response = await api.sendRequestWithPagination(url);

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    activity.Response.Data = mapResponseToItems(response);
  } catch (error) {
    cfActivity.handleError(activity, error);
  }
};

//**maps response to items */
function mapResponseToItems(response) {
  let items = [];
  let leads = response.body.records;

  let salesforceDomain = api.getDomain();

  for (let i = 0; i < leads.length; i++) {
    let raw = leads[i];

    let item = {
      id: raw.Id,
      title: raw.FirstName,
      description: raw.LastName,
      link: `https://${salesforceDomain}/lightning/r/Lead/${raw.Id}/view`,
      raw: raw
    };
    items.push(item);
  }

  return { items: items };
}