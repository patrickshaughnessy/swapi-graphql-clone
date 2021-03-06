/* */ 
'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.unusedFragMessage = unusedFragMessage;
exports.NoUnusedFragments = NoUnusedFragments;
var _error = require('../../error/index');
function unusedFragMessage(fragName) {
  return 'Fragment "' + fragName + '" is never used.';
}
function NoUnusedFragments(context) {
  var operationDefs = [];
  var fragmentDefs = [];
  return {
    OperationDefinition: function OperationDefinition(node) {
      operationDefs.push(node);
      return false;
    },
    FragmentDefinition: function FragmentDefinition(node) {
      fragmentDefs.push(node);
      return false;
    },
    Document: {leave: function leave() {
        var fragmentNameUsed = Object.create(null);
        operationDefs.forEach(function(operation) {
          context.getRecursivelyReferencedFragments(operation).forEach(function(fragment) {
            fragmentNameUsed[fragment.name.value] = true;
          });
        });
        fragmentDefs.forEach(function(fragmentDef) {
          var fragName = fragmentDef.name.value;
          if (fragmentNameUsed[fragName] !== true) {
            context.reportError(new _error.GraphQLError(unusedFragMessage(fragName), [fragmentDef]));
          }
        });
      }}
  };
}
