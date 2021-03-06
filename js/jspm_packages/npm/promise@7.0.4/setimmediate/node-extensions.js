/* */ 
'use strict';
var Promise = require('./core');
module.exports = Promise;
Promise.denodeify = function(fn, argumentCount) {
  argumentCount = argumentCount || Infinity;
  return function() {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 0, argumentCount > 0 ? argumentCount : 0);
    return new Promise(function(resolve, reject) {
      args.push(function(err, res) {
        if (err)
          reject(err);
        else
          resolve(res);
      });
      var res = fn.apply(self, args);
      if (res && (typeof res === 'object' || typeof res === 'function') && typeof res.then === 'function') {
        resolve(res);
      }
    });
  };
};
Promise.nodeify = function(fn) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null;
    var ctx = this;
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx);
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function(resolve, reject) {
          reject(ex);
        });
      } else {
        setImmediate(function() {
          callback.call(ctx, ex);
        });
      }
    }
  };
};
Promise.prototype.nodeify = function(callback, ctx) {
  if (typeof callback != 'function')
    return this;
  this.then(function(value) {
    setImmediate(function() {
      callback.call(ctx, null, value);
    });
  }, function(err) {
    setImmediate(function() {
      callback.call(ctx, err);
    });
  });
};
