/* */ 
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
var _get = function get(_x, _x2, _x3) {
  var _again = true;
  _function: while (_again) {
    var object = _x,
        property = _x2,
        receiver = _x3;
    desc = parent = getter = undefined;
    _again = false;
    if (object === null)
      object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);
    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);
      if (parent === null) {
        return undefined;
      } else {
        _x = parent;
        _x2 = property;
        _x3 = receiver;
        _again = true;
        continue _function;
      }
    } else if ('value' in desc) {
      return desc.value;
    } else {
      var getter = desc.get;
      if (getter === undefined) {
        return undefined;
      }
      return getter.call(receiver);
    }
  }
};
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }});
  if (superClass)
    Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}
var _language = require('../language/index');
var GraphQLError = (function(_Error) {
  _inherits(GraphQLError, _Error);
  function GraphQLError(message, nodes, stack, source, positions) {
    _classCallCheck(this, GraphQLError);
    _get(Object.getPrototypeOf(GraphQLError.prototype), 'constructor', this).call(this, message);
    this.message = message;
    Object.defineProperty(this, 'stack', {value: stack || message});
    Object.defineProperty(this, 'nodes', {value: nodes});
    Object.defineProperty(this, 'source', {get: function get() {
        if (source) {
          return source;
        }
        if (nodes && nodes.length > 0) {
          var node = nodes[0];
          return node && node.loc && node.loc.source;
        }
      }});
    Object.defineProperty(this, 'positions', {get: function get() {
        if (positions) {
          return positions;
        }
        if (nodes) {
          var nodePositions = nodes.map(function(node) {
            return node.loc && node.loc.start;
          });
          if (nodePositions.some(function(p) {
            return p;
          })) {
            return nodePositions;
          }
        }
      }});
    Object.defineProperty(this, 'locations', {get: function get() {
        var _this = this;
        if (this.positions && this.source) {
          return this.positions.map(function(pos) {
            return (0, _language.getLocation)(_this.source, pos);
          });
        }
      }});
  }
  return GraphQLError;
})(Error);
exports.GraphQLError = GraphQLError;
