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
   this.name = name;
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
   loading: function () {
      empty_elem(this.ui.content);
      var div = document.createElement('div');
      div.className = 'item';
      var span = document.createElement('span');
      span.className = 'spin spin-sm';
      div.appendChild(span);
      elem_append_text(div, ' Loading ...');
      this.ui.content.appendChild(div);
   },
   reset: function (name, obj) {
      empty_elem(this.ui.title);
      empty_elem(this.ui.content);
      if (name) {
         this.name = name;
      } else {
         name = this.name;
      }
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
   // TODO: decouple container in index.html
   //                                         v pnl-side
   //                              v (div)
   //                   v pnl-side-analysis
   //               v analysis_pnl-item
   this.container = dom.parentNode.parentNode.parentNode
   empty_elem(dom);
   this.blocks = {};
}
AnalysisBlockManager.prototype = {
   getBlock: function (id) {
      return this.blocks[id];
   },
   show: function (dom) {
      this.self.appendChild(dom);
   },
   showBlock: function (id, name, obj, opt) {
      opt = opt || {};
      var block = this.blocks[id];
      if (block) {
         block.opt = Object.assign(block.opt, opt);
         block.reset(name, obj);
         return block;
      }
      var fn = opt.onDispose;
      var that = this;
      opt.onDispose = function (self) {
         delete that.blocks[id];
         fn && fn(self);
      };
      block = new AnalysisBlock(name, opt);
      block.reset(name, obj);
      this.blocks[id] = block;
      this.self.appendChild(block.dom());
      return block;
   },
   scrollToBlock: function (id) {
      var block = this.blocks[id];
      if (!block) return;
      var curTop = this.container.scrollTop, curH = this.container.offsetHeight;
      var dom = block.dom();
      var top = dom.offsetTop - this.container.offsetTop, bottom = top + dom.offsetHeight;
      var x = this.container.scrollLeft;
      if (curTop > top) {
         this.container.scrollTo(x, top);
      } else if (curTop + curH < bottom) {
         var y = top + curH - (bottom - top);
         if (y > top) y = top;
         this.container.scrollTo(x, y);
      }
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

function AnalysisTopic(topic) {
   this.block = new AnalysisBlock('topic: ' + topic, {});
   this.ui = {
      self: this.block.dom(),
      block: {
         item: new AnalysisBlock('item', {
            disableClose: true
            // TODO: onReset
         }),
         comment: new AnalysisBlock('comment', {
            disableClose: true
            // TODO: onReset
         })
      }
   };
   this.block.ui.title.title = topic;
   this.block.loading();
   this.block.show();
   this.req = Flame.api.topic.getMetadata(topic);
   var that = this;
   this.req.then(
      function (obj) {
         that.data = obj;
         that.render();
         that.req = null;
      },
      function (err) {
         throw err;
      }
   );
}
AnalysisTopic.prototype = {
   dom: function () { return this.ui.self; },
   render: function () {
      var obj = Object.assign({}, this.data);
      var info = {
         name: obj.name,
         scope: obj.scope,
         user: obj.user
      };
      delete obj.name;
      delete obj.scope;
      delete obj.user;
      empty_elem(this.block.ui.content);
      this.block.ui.content.appendChild(this.ui.block.item.dom());
      this.block.ui.content.appendChild(this.ui.block.comment.dom());
      if (obj.item && obj.item.length) {
         this.ui.block.item.reset('item', obj.item);
         delete obj.item;
      } else {
         this.ui.block.item.reset('item', []);
      }
      if (obj.comment && obj.comment.length) {
         this.ui.block.comment.reset('comment', obj.comment);
         delete obj.comment;
      } else {
         this.ui.block.comment.reset('comment', []);
      }
      for (var name in obj) {
         var block = this.ui.block[name];
         if (!block) {
            block = new AnalysisBlock(name, {
               disableClose: true
               // TODO: onReset
            });
            this.ui.block[name] = block;
            this.block.ui.content.appendChild(block);
         }
         block.reset(name, obj[name]);
      }
   },
   dispose: function () {
      for (var name in this.ui.block) {
         this.ui.block[name].dispose();
      }
      this.block.dispose();
   }
};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   AnalysisBlock: AnalysisBlock,
   AnalysisBlockManager: AnalysisBlockManager,
   AnalysisTopic: AnalysisTopic
});

})();
