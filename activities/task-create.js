'use strict';
const api = require('./common/api');
const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

module.exports = async (activity) => {
  try {
    var data = {};

    // extract _action from Request
    var _action = getObjPath(activity.Request, "Data.model._action");
    if (_action) {
      activity.Request.Data.model._action = {};
    } else {
      _action = {};
    }

    switch (activity.Request.Path) {

      case "create":
      case "submit":
        const form = _action.form;
        api.initialize(activity);
        var response = await api.post("/v26.0/sobjects/task", {
          json: true,
          body: {
            Subject: form.subject,
            Description: form.description,
            ActivityDate: form.duetime,
            Priority: form.priority
          }
        });

        var comment = T(activity, "Task {0} created", response.body.id);
        data = getObjPath(activity.Request, "Data.model");
        data._action = {
          response: {
            success: true,
            message: comment
          }
        };
        break;

      default:
        var fname = __dirname + path.sep + "common" + path.sep + "task-create.form";
        var schema = yaml.safeLoad(fs.readFileSync(fname, 'utf8'));

        data.title = T(activity, "Create Salesforce Task");
        data.formSchema = schema;
        // initialize form subject with query parameter (if provided)
        if (activity.Request.Query && activity.Request.Query.query) {
          data = {
            form: {
              subject: activity.Request.Query.query
            }
          }
        }
        data._actionList = [{
          id: "create",
          label: T(activity, "Create Task"),
          settings: {
            actionType: "a"
          }
        }];
        break;
    }

    // copy response data
    activity.Response.Data = data;
    activity.Response.Data._card = {
      type: 'form',
    };
  } catch (error) {
    // handle generic exception
    $.handleError(activity, error);
  }

  function getObjPath(obj, path) {

    if (!path) return obj;
    if (!obj) return null;

    var paths = path.split('.'),
      current = obj;

    for (var i = 0; i < paths.length; ++i) {
      if (current[paths[i]] == undefined) {
        return undefined;
      } else {
        current = current[paths[i]];
      }
    }
    return current;
  }
};
