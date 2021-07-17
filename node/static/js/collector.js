'use strict';

//@include js/common.js
//@include js/api.js

(function () {

// to guarantee ajax requests not sending for too many times
// if requested or waiting for server response
function Collector() {
   this.req = {};
}
Collector.prototype = {
   ajax: function (opt) {
      if (this.req[opt.url]) {
         return this.req[opt.url];
      }
      var that = this;
      return new Promise(function (r, e) {
         ajax(opt, function (res) {
            r(res);
            delete that.req[opt.url];
         }, function (err) {
            delete that.req[opt.url];
            e(err);
         })
      });
   },
   call: function (id, fn, args) {
      if (this.req[id]) return this.req[id];
      var that = this;
      return new Promise(function (r, e) {
         try {
            var ret = fn.apply(null, args);
            if (ret instanceof Promise) {
               ret.then(r, e);
            } else {
               r(ret);
            }
         } catch (err) {
            e(err)
         }
      });
   }
};

function CancelableAjaxRequest(collector, opt) {
   var that = this;
   this.xhr = null;
   this.canceled = false;
   this.id = opt.url;
   this._promise = new Promise(function (r, e) {
      that.xhr = ajax(opt, function (res) {
         that.xhr = null;
         if (that.canceled) return r({ canceled: true });
         r(res);
         delete collector.req[id];
      }, function (err) {
         that.xhr = null;
         if (that.canceled) return r({ canceled: true });
         delete collector.req[id];
         e(err);
      })
   });
}
CancelableAjaxRequest.prototype = {
   promise: function () { return this._promise; },
   cancel: function () {
      if (this.xhr) {
         this.canceled = true;
         this.xhr.abort();
      }
      delete collector.req[this.id];
   }
};

window.Flame = window.Flame || {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   Collector: Collector
});

})();
