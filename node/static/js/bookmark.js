'use strict';

//@include js/common.js
//@include css/analysis.css

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
      if (!this.items.filter(function (x) {
         if (x.P !== item.P) return false;
         if (!x.L && !item.L) return true;
         return x.L === item.L;
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
         if (x.P !== path) return false;
         if (!x.L && !linenumber) return true;
         return x.L === linenumber;
      })[0];
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

      this.events = {
         onDelBookMarkItem: function (evt) {
            var target = evt.target;
            if (!target.classList.contains('ab-bookmark-del-item')) return;
            var div = target.parentNode;
            var bid = div.getAttribute('data-bid');
            var parts = bid.split('#');
            var path, linenumber;
            if (parts.length === 1) {
               linenumber = null;
               path = parts[0];
            } else {
               linenumber = parseInt(parts.pop(), 10);
               path = parts.join('#');
            }
            that.del(path, linenumber);
            that.render();
         }
      };
      this.block.ui.content.addEventListener('click', this.events.onDelBookMarkItem);
   },
   render: function () {
      if (!this.block) return;
      var div;
      if (!this.items.length) {
         div = document.createElement('div');
         div.className = 'item item-red';
         elem_append_text(div, 'No Item');
         empty_elem(this.block.ui.content);
         div.setAttribute('data-bid', '-');
         this.block.ui.content.appendChild(div);
         return;
      }
      // TODO: render items
      var map = {};
      for (var i = 0, n = this.block.ui.content.children.length; i < n; i++) {
         div = this.block.ui.content.children[i];
         var bid = div.getAttribute('data-bid');
         map[bid] = { del: true, div: div };
      }
      for (var i = 0, n = this.items.length; i < n; i++) {
         var item = this.items[i];
         var bid = item.P + (item.L?('#' + item.L):'');
         if (map[bid]) {
            map[bid].del = false;
         } else {
            div = document.createElement('div');
            div.className = 'item-thin item-blue';
            div.setAttribute('data-bid', bid);

            var btn = document.createElement('button');
            btn.className = 'ab-btn ab-bookmark-del-item';
            elem_append_html(btn, '&times');
            div.appendChild(btn);
            elem_append_text(div, ' ');

            btn = document.createElement('a');
            btn.href = '#' + item.P;
            btn.title = item.P;
            var name = item.P.split('/').pop();
            elem_append_text(btn, name);
            if (item.L) {
               btn.href += '#L=' + item.L;
               btn.title += '#' + item.L;
               elem_append_text(btn, '#' + item.L);
            }
            div.appendChild(btn);
            map[bid] = { new: true, div: div };
         }
      }
      for (var bid in map) {
         var uiitem = map[bid];
         if (uiitem.del) {
            this.block.ui.content.removeChild(uiitem.div);
         } else if (uiitem.new) {
            this.block.ui.content.appendChild(uiitem.div);
         }
      }
   },
   dispose: function () {
      this.block.ui.content.removeEventListener('click', this.events.onDelBookMarkItem);
   }
};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   BookMark: BookMark
});

})();
