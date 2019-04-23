'use strict';
const got = require('got');
const HttpAgent = require('agentkeepalive');
const HttpsAgent = HttpAgent.HttpsAgent;

let _activity = null;

function api(path, opts) {
  if (typeof path !== 'string') {
    return Promise.reject(new TypeError(`Expected \`path\` to be a string, got ${typeof path}`));
  }

  const salesforceDomain = api.getDomain();

  opts = Object.assign({
    json: true,
    token: _activity.Context.connector.token,
    endpoint: `https://${salesforceDomain}/services/data`,
    agent: {
      http: new HttpAgent(),
      https: new HttpsAgent()
    }
  }, opts);

  opts.headers = Object.assign({
    accept: 'application/json',
    'user-agent': 'adenin Digital Assistant Connector, https://www.adenin.com/digital-assistant'
  }, opts.headers);

  if (opts.token) opts.headers.Authorization = `Bearer ${opts.token}`;

  const url = /^http(s)\:\/\/?/.test(path) && opts.endpoint ? path : opts.endpoint + path;

  if (opts.stream) return got.stream(url, opts);

  return got(url, opts).catch((err) => {
    throw err;
  });
}

const helpers = [
  'get',
  'post',
  'put',
  'patch',
  'head',
  'delete'
];

api.initialize = (activity) => {
  _activity = activity;
};

api.stream = (url, opts) => got(url, Object.assign({}, opts, {
  json: false,
  stream: true
}));

//** returns Salesforce domain in correct format */
api.getDomain = function () {
  let domain = _activity.Context.connector.custom1;
  domain = domain.replace('https://', '');
  domain = domain.replace('/', '');

  if (!domain.includes('.salesforce.com')) {
    domain += '.salesforce.com';
  }
  return domain;
};

for (const x of helpers) {
  const method = x.toUpperCase();
  api[x] = (url, opts) => api(url, Object.assign({}, opts, { method }));
  api.stream[x] = (url, opts) => api.stream(url, Object.assign({}, opts, { method }));
}

//**sends request to provided url and pagination using limit and offset*/
api.sendRequestWithPagination = function (url) {
  const pagination = $.pagination(_activity);
  const pageSize = parseInt(pagination.pageSize, 10);
  const offset = (parseInt(pagination.page, 10) - 1) * pageSize;

  url += `+LIMIT+${pageSize}+OFFSET+${offset}`;

  return api(url);
};

//**maps response to items */
api.mapTicketsAndTasksToItems = function (responseDataArr, itemName) {
  let items = [];

  let salesforceDomain = api.getDomain();

  for (let i = 0; i < responseDataArr.length; i++) {
    let raw = responseDataArr[i];

    let item = {
      id: raw.Id,
      title: raw.Subject,
      description: raw.Description,
      link: `https://${salesforceDomain}/lightning/r/${itemName}/${raw.Id}/view`,
      raw: raw
    };
    items.push(item);
  }

  return { items: items };
};

//**maps response to items */
api.mapLeadsToItems = function (responseDataArr) {
  let items = [];

  let salesforceDomain = api.getDomain();

  for (let i = 0; i < responseDataArr.length; i++) {
    let raw = responseDataArr[i];

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
};

module.exports = api;
