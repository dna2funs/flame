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
   show: function () {
      this.ui.fold.classList.add('active');
      this.ui.content.style.display = 'block';
   },
   hide: function () {
      this.ui.fold.classList.remove('active');
      this.ui.content.style.display = 'none';
   },
   isFolded: function () { return this.ui.content.style.display === 'none'; },
   dispose: function () {
      this.ui.fold.removeEventListener('click', this.events.onClickFold);
      this.ui.close.removeEventListener('click', this.events.onClickClose);
      var parent = this.ui.self.parentNode
      if (parent) parent.removeChild(this.ui.self);
   }
};

function AnalysisBlockManager() {}
AnalysisBlockManager.prototype = {};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   AnalysisBlock: AnalysisBlock,
   AnalysisBlockManager: AnalysisBlockManager
});

})();
