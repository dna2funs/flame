'use strict';

//@include css/common.css
//@include js/common.js
//@include js/api.js

(function () {

/*
<div class="ab-container">
   <div class="ab-title flex-table flex-row">
      <button class="ab-title-fold"><img src="img/angle.svg"></button>
      <div class="item-thin item-yellow flex-w0 flex-auto">{title}</div>
      <button class="ab-title-close">&times;</button>
   </div>
   <div style="display: none;">{content}</div>
</div>
 */
function AnalysisBlock(name, opt) {
   // opt:
   //   - disableClose
   //   - onDispose
   //   - onReset
   this.opt = opt || {};
   this.ui = {
      self: document.createElement('div'),
      title: document.createElement('div'),
      fold: document.createElement('button'),
      close: document.createElement('button'),
      content: document.createElement('div')
   };

   var div = document.createElement('div');
   div.className = 'ab-title flex-table flex-row';
   var img = document.createElement('img');
   img.src = 'img/angle.svg';
   this.ui.fold.appendChild(img);
   elem_append_text(this.ui.title, name);
   elem_append_html(this.ui.close, '&times');
   this.ui.title.className = 'item-thin item-yellow flex-w0 flex-auto';
   this.ui.fold.className = 'ab-title-fold';
   this.ui.close.className = 'ab-title-close';
   if (this.opt.disableClose) this.ui.close.style.display = 'none';
   div.appendChild(this.ui.fold);
   div.appendChild(this.ui.title);
   div.appendChild(this.ui.close);
   this.ui.content.style.display = 'none';
   this.ui.self.className = 'ab-container';
   this.ui.self.appendChild(div);
   this.ui.self.appendChild(this.ui.content);

   var that = this;
   this.events = {
      onClickClose: function () {
         that.hide();
         that.dispose();
      },
      onClickFold: function () {
         if (that.isFolded()) that.show(); else that.hide();
      }
   };
   this.ui.fold.addEventListener('click', this.events.onClickFold);
   this.ui.close.addEventListener('click', this.events.onClickClose);
}
AnalysisBlock.prototype = {
   dom: function () { return this.ui.self; },
   isFolded: function () { return this.ui.content.style.display === 'none'; },
   reset: function (name, obj) {
      empty_elem(this.ui.title);
      empty_elem(this.ui.content);
      elem_append_text(this.ui.title, name);
      this.opt.onReset && this.opt.onReset(this, obj);
   },
   show: function () {
      this.ui.fold.classList.add('active');
      this.ui.content.style.display = 'block';
   },
   hide: function () {
      this.ui.fold.classList.remove('active');
      this.ui.content.style.display = 'none';
   },
   dispose: function () {
      this.ui.fold.removeEventListener('click', this.events.onClickFold);
      this.ui.close.removeEventListener('click', this.events.onClickClose);
      var parent = this.ui.self.parentNode
      if (parent) parent.removeChild(this.ui.self);
      this.opt.onDispose && this.opt.onDispose(this);
   }
};

function AnalysisBlockManager(dom) {
   this.self = dom;
   empty_elem(dom);
   this.blocks = {};
}
AnalysisBlockManager.prototype = {
   showBlock: function (id, name, obj, opt) {
      var block = this.blocks[id];
      if (block) {
         block.opt = Object.assign(block.opt, opt);
         block.reset(name, obj);
         return block;
      }
      var fn = opt.onDispose;
      var that = this;
      opt.onDispose = function () {
         delete that.blocks[id];
         fn && fn();
      };
      block = new AnalysisBlock(name, opt);
      block.reset(name, obj);
      this.blocks[id] = block;
      this.self.appendChild(block.dom());
      return block;
   },
   fold: function (id) {
      var block = this.blocks[id];
      if (block) block.hide();
   },
   unfold: function (id) {
      var block = this.blocks[id];
      if (block) block.show();
   },
   dom: function () { return this.self; }
};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   AnalysisBlock: AnalysisBlock,
   AnalysisBlockManager: AnalysisBlockManager
});

})();