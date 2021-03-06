/* */ 
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.unknownArgMessage = unknownArgMessage;
exports.unknownDirectiveArgMessage = unknownDirectiveArgMessage;
exports.KnownArgumentNames = KnownArgumentNames;
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {'default': obj};
}
var _error = require('../../error/index');
var _jsutilsFind = require('../../jsutils/find');
var _jsutilsFind2 = _interopRequireDefault(_jsutilsFind);
var _jsutilsInvariant = require('../../jsutils/invariant');
var _jsutilsInvariant2 = _interopRequireDefault(_jsutilsInvariant);
var _languageKinds = require('../../language/kinds');
function unknownArgMessage(argName, fieldName, type) {
  return 'Unknown argument "' + argName + '" on field "' + fieldName + '" of ' + ('type "' + type + '".');
}
function unknownDirectiveArgMessage(argName, directiveName) {
  return 'Unknown argument "' + argName + '" on directive "@' + directiveName + '".';
}
function KnownArgumentNames(context) {
  return {Argument: function Argument(node, key, parent, path, ancestors) {
      var argumentOf = ancestors[ancestors.length - 1];
      if (argumentOf.kind === _languageKinds.FIELD) {
        var fieldDef = context.getFieldDef();
        if (fieldDef) {
          var fieldArgDef = (0, _jsutilsFind2['default'])(fieldDef.args, function(arg) {
            return arg.name === node.name.value;
          });
          if (!fieldArgDef) {
            var parentType = context.getParentType();
            (0, _jsutilsInvariant2['default'])(parentType);
            context.reportError(new _error.GraphQLError(unknownArgMessage(node.name.value, fieldDef.name, parentType.name), [node]));
          }
        }
      } else if (argumentOf.kind === _languageKinds.DIRECTIVE) {
        var directive = context.getDirective();
        if (directive) {
          var directiveArgDef = (0, _jsutilsFind2['default'])(directive.args, function(arg) {
            return arg.name === node.name.value;
          });
          if (!directiveArgDef) {
            context.reportError(new _error.GraphQLError(unknownDirectiveArgMessage(node.name.value, directive.name), [node]));
          }
        }
      }
    }};
}
