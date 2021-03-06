/* */ 
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.valueFromAST = valueFromAST;
function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};
    if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          newObj[key] = obj[key];
      }
    }
    newObj['default'] = obj;
    return newObj;
  }
}
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj};
}
var _jsutilsKeyMap = require('../jsutils/keyMap');
var _jsutilsKeyMap2 = _interopRequireDefault(_jsutilsKeyMap);
var _jsutilsInvariant = require('../jsutils/invariant');
var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);
var _jsutilsIsNullish = require('../jsutils/isNullish');
var _jsutilsIsNullish2 = _interopRequireDefault(_jsutilsIsNullish);
var _languageKinds = require('../language/kinds');
var Kind = _interopRequireWildcard(_languageKinds);
var _typeDefinition = require('../type/definition');
function valueFromAST(_x, _x2, _x3) {
  var _again = true;
  _function: while (_again) {
    var valueAST = _x,
        type = _x2,
        variables = _x3;
    nullableType = variableName = itemType = fields = fieldASTs = parsed = undefined;
    _again = false;
    if (type instanceof _typeDefinition.GraphQLNonNull) {
      var nullableType = type.ofType;
      _x = valueAST;
      _x2 = nullableType;
      _x3 = variables;
      _again = true;
      continue _function;
    }
    if (!valueAST) {
      return null;
    }
    if (valueAST.kind === Kind.VARIABLE) {
      var variableName = valueAST.name.value;
      if (!variables || !variables.hasOwnProperty(variableName)) {
        return null;
      }
      return variables[variableName];
    }
    if (type instanceof _typeDefinition.GraphQLList) {
      var itemType = type.ofType;
      if (valueAST.kind === Kind.LIST) {
        return valueAST.values.map(function(itemAST) {
          return valueFromAST(itemAST, itemType, variables);
        });
      }
      return [valueFromAST(valueAST, itemType, variables)];
    }
    if (type instanceof _typeDefinition.GraphQLInputObjectType) {
      var fields = type.getFields();
      if (valueAST.kind !== Kind.OBJECT) {
        return null;
      }
      var fieldASTs = (0, _jsutilsKeyMap2['default'])(valueAST.fields, function(field) {
        return field.name.value;
      });
      return Object.keys(fields).reduce(function(obj, fieldName) {
        var field = fields[fieldName];
        var fieldAST = fieldASTs[fieldName];
        var fieldValue = valueFromAST(fieldAST && fieldAST.value, field.type, variables);
        if ((0, _jsutilsIsNullish2['default'])(fieldValue)) {
          fieldValue = field.defaultValue;
        }
        if (!(0, _jsutilsIsNullish2['default'])(fieldValue)) {
          obj[fieldName] = fieldValue;
        }
        return obj;
      }, {});
    }
    (0, _jsutilsInvariant2['default'])(type instanceof _typeDefinition.GraphQLScalarType || type instanceof _typeDefinition.GraphQLEnumType, 'Must be input type');
    var parsed = type.parseLiteral(valueAST);
    if (!(0, _jsutilsIsNullish2['default'])(parsed)) {
      return parsed;
    }
  }
}
