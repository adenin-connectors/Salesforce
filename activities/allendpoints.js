'use strict';
const cfActivity = require('@adenin/cf-activity');
const api = require('./common/api');

module.exports = async function (activity) {

  try {
    api.initialize(activity);

    const response = await api('/v26.0');

    if (!cfActivity.isResponseOk(activity, response)) {
      return;
    }

    activity.Response.Data = getEndpoints(response);
  } catch (error) {

    cfActivity.handleError(activity, error);
  }
};
//**maps response data to items */
function getEndpoints(response) {
  let items = [];
  let endpoints = Object.entries(response.body);

  let salesforceDomain = api.getDomain();

  for (let i = 0; i < endpoints.length; i++) {
    let raw = endpoints[i];
    let item = {
      name: raw[0],
      url: `https://${salesforceDomain}/services/data/v26.0/${raw[0]}`,
      raw: raw
    };

    if (raw[0] == 'identity') {
      item = {
        ...item,
        link: raw[1]
      };
    }

    items.push(item);
  }

  return { items: items };
}