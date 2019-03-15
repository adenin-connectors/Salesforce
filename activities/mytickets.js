'use strict';

const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async function (activity) {
  try {
    api.initialize(activity);

    const response = await api(`/v40.0/query?q=SELECT Id,Subject,Description FROM case`);

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