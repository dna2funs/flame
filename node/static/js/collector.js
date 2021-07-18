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

function TaskExecutor () {
   this.runner = {};
   this.task = [];
   this.running = false;
}
TaskExecutor.prototype = {
   _run: function () {
      if (this.running) return;
      if (!this.task.length) return;
      this.running = true;
      var task = this.task.shift();
      var promiseFn = this.runner[task.task];
      try {
         if (promiseFn) {
            var that = this;
            promiseFn(task).then(
               function (res) {
                  task.promise.r({ task: task.name, out: res });
                  that.running = false;
                  that._run();
               },
               function (err) {
                  task.promise.e({ task: task.name, err: err });
                  that.running = false;
                  that._run();
               }
            )
         } else {
            throw 'no_runner';
         }
      } catch(err) {
         task.promise.e({ task: task.name, err: err });
         this.running = false;
         this._run();
      }
   },
   register: function (name, promiseFn) {
      this.runner[name] = promiseFn;
   },
   exec: function (name, obj) {
      var that = this;
      return new Promise(function (r, e) {
         var task = Object.assign({
            task: name,
            promise: { r: r, e: e }
         }, obj);
         that.task.push(task);
         that._run();
      });
   }
};

window.Flame = window.Flame || {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   Collector: Collector,
   TaskExecutor: TaskExecutor
});

})();
