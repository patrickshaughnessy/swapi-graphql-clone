/* */ 
(function(process) {
  'use strict';
  var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];
  var GraphQLStoreDataHandler = require('./GraphQLStoreDataHandler');
  var RelayConnectionInterface = require('./RelayConnectionInterface');
  var RelayNodeInterface = require('./RelayNodeInterface');
  var RelayQuery = require('./RelayQuery');
  var forEachObject = require('fbjs/lib/forEachObject');
  var invariant = require('fbjs/lib/invariant');
  var warning = require('fbjs/lib/warning');
  var ARGUMENTS = /^(\w+)(?:\((.+?)\))?$/;
  var ARGUMENT_NAME = /(\w+)(?=\s*:)/;
  var DEPRECATED_CALLS = /^\w+(?:\.\w+\(.*?\))+$/;
  var DEPRECATED_CALL = /^(\w+)\((.*?)\)$/;
  var NODE = RelayConnectionInterface.NODE;
  var EDGES = RelayConnectionInterface.EDGES;
  var ANY_TYPE = RelayNodeInterface.ANY_TYPE;
  var ID = RelayNodeInterface.ID;
  var idField = RelayQuery.Field.build({
    fieldName: ID,
    type: 'String'
  });
  var cursorField = RelayQuery.Field.build({
    fieldName: 'cursor',
    type: 'String'
  });
  function inferRelayFieldsFromData(data) {
    var fields = [];
    forEachObject(data, function(value, key) {
      if (!GraphQLStoreDataHandler.isMetadataKey(key)) {
        fields.push(inferField(value, key));
      }
    });
    return fields;
  }
  function inferField(value, key) {
    var metadata = {isPlural: false};
    var children = undefined;
    if (Array.isArray(value)) {
      var element = value[0];
      if (element && typeof element === 'object') {
        children = inferRelayFieldsFromData(element);
      } else {
        children = [];
      }
      metadata.isPlural = true;
    } else if (typeof value === 'object' && value !== null) {
      children = inferRelayFieldsFromData(value);
    } else {
      children = [];
    }
    if (key === NODE) {
      children.push(idField);
    } else if (key === EDGES) {
      children.push(cursorField);
    }
    return buildField(key, children, metadata);
  }
  function buildField(key, children, metadata) {
    var fieldName = key;
    var calls = null;
    if (DEPRECATED_CALLS.test(key)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'inferRelayFieldsFromData(): Encountered an optimistic payload with ' + 'a deprecated field call string, `%s`. Use valid GraphQL OSS syntax.', key) : undefined;
      var parts = key.split('.');
      if (parts.length > 1) {
        fieldName = parts.shift();
        calls = parts.map(function(callString) {
          var captures = callString.match(DEPRECATED_CALL);
          !captures ? process.env.NODE_ENV !== 'production' ? invariant(false, 'inferRelayFieldsFromData(): Malformed data key, `%s`.', key) : invariant(false) : undefined;
          var value = captures[2].split(',');
          return {
            name: captures[1],
            value: value.length === 1 ? value[0] : value
          };
        });
      }
    } else {
      var captures = key.match(ARGUMENTS);
      !captures ? process.env.NODE_ENV !== 'production' ? invariant(false, 'inferRelayFieldsFromData(): Malformed data key, `%s`.', key) : invariant(false) : undefined;
      fieldName = captures[1];
      if (captures[2]) {
        try {
          (function() {
            var args = JSON.parse('{' + captures[2].replace(ARGUMENT_NAME, '"$1"') + '}');
            calls = _Object$keys(args).map(function(name) {
              return {
                name: name,
                value: args[name]
              };
            });
          })();
        } catch (error) {
          !false ? process.env.NODE_ENV !== 'production' ? invariant(false, 'inferRelayFieldsFromData(): Malformed or unsupported data key, ' + '`%s`. Only booleans, strings, and numbers are currenly supported, ' + 'and commas are required. Parse failure reason was `%s`.', key, error.message) : invariant(false) : undefined;
        }
      }
    }
    return RelayQuery.Field.build({
      calls: calls,
      children: children,
      fieldName: fieldName,
      metadata: metadata,
      type: ANY_TYPE
    });
  }
  module.exports = inferRelayFieldsFromData;
})(require('process'));
