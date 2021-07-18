'use strict';

//@include js/common.js

(function () {

function BookMark() {
   this.block = null;
   this.load();
}
BookMark.prototype = {
   dom: function () { return this.block.dom(); },
   load: function () {
      this.items = JSON.parse(localStorage.getItem('bookmark') || '[]');
   },
   save: function () {
      localStorage.setItem('bookmark', JSON.stringify(this.items));
   },
   add: function (path, linenumber) {
      if (!path) return false;
      this.load();
      var item = { P: path, L: linenumber };
      if (this.items.filter(function (x) {
         return x.P === item.P && x.L === item.L;
      })[0]) {
         this.items.push(item);
         this.save();
         return true;
      }
      return false;
   },
   del: function (path, linenumber) {
      if (!path) return false;
      this.load();
      var item = this.items.filter(function (x) {
         return x.P === item.P && x.L === item.L;
      })[0]);
      if (!item) return false;
      this.items.splice(this.items.indexOf(item), 1);
      this.save();
      return true;
   },
   clear: function () {
      this.items = [];
      this.save();
   },
   bind: function (analysisBlockMgr) {
      var that = this;
      if (this.block) this.block.dispose();
      this.block = analysisBlockMgr.showBlock('flame://bookmark', 'bookmark', null, {
         disableClose: true,
         onReset: function (self, obj) {
            that.render();
         },
         onDispose: function () {
            that.dipose();
         }
      });
      this.render();
   },
   render: function () {
      if (!this.block) return;
      var div;
      if (!this.items.length) {
         div = document.createElement('div');
         div.className = 'item item-red';
         elem_append_text(div, 'No Item');
         empty_elem(this.block.ui.content);
         this.block.ui.content.appendChild(div);
         return;
      }
      // TODO: render items
   },
   dispose: function () {}
};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   BookMark: BookMark
});

})();
