'use strict';

//@include css/editor.css
//@include js/common.js

(function () {

function SourceCodeViewer(dom, text, opt) {
   // opt:
   //   - onClickLineNumber(linenumber)
   this.opt = opt || {};
   this.lines = text.split('\n');

   this.ui = {
      self: dom,
      container: document.createElement('div'),
      leftSide: document.createElement('div'),
      lineNumber: document.createElement('div'),
      blame: document.createElement('div'),
      text: document.createElement('pre'),
      highlight: document.createElement('div'),
      extra: {
         highlight: {
            line: document.createElement('div')
         }
      }
   };

   var root = this.ui.container;
   root.className = 'editor-container';
   this.render();

   // post: ui before to screen
   var sideFlex = document.createElement('div');
   sideFlex.className = 'editor-side-flex';
   this.ui.leftSide.className = 'editor-left-side';
   this.ui.text.className = 'editor-text flex-auto';
   this.ui.lineNumber.className = 'editor-linenumber';
   this.ui.highlight.className = 'editor-highlight';
   this.ui.blame.style.display = 'none';

   // assemble components
   sideFlex.appendChild(this.ui.lineNumber);
   sideFlex.appendChild(this.ui.blame);
   this.ui.leftSide.appendChild(sideFlex);
   root.appendChild(this.ui.highlight);
   root.appendChild(this.ui.leftSide);
   root.appendChild(this.ui.text);
   empty_elem(this.ui.self);
   this.ui.self.appendChild(root);
   // post: ui attached to screen
   sideFlex.style.font = getComputedStyle(this.ui.text).font;

   var that = this;
   this.events = {
      onClickLineNumber: function (evt) {
         if (evt.target.tagName.toLowerCase() !== 'a') return;
         var linenumber = parseInt(evt.target.textContent, 10);
         if (linenumber <= 0) return;
         if (linenumber > that.lines.length) return;
         that.opt.onClickLineNumber && that.opt.onClickLineNumber(linenumber);
      }
   };
   this.ui.lineNumber.addEventListener('click', this.events.onClickLineNumber);

   this.cache = {
      maxLineWidth: 0
   };
   this.computeCache();
}
SourceCodeViewer.prototype = {
   render: function () {
      // TODO: show blame info for each line in this.ui.blame (by default display: none)
      // TODO: syntax highlight for source code text;
      //       but gurantee each line <span> ... </span><br />
      empty_elem(this.ui.lineNumber);
      empty_elem(this.ui.text);
      var that = this;
      this.lines.forEach(function (line, i) {
         if (i > 0) {
            that.ui.lineNumber.appendChild(document.createElement('br'));
            that.ui.text.appendChild(document.createElement('br'));
         }
         var a = document.createElement('a');
         a.appendChild(document.createTextNode('' + (i + 1)));
         that.ui.lineNumber.appendChild(a);
         var span = document.createElement('span');
         span.appendChild(document.createTextNode(line));
         that.ui.text.appendChild(span);
      });
   },
   bindMetadata: function (metadata) {
      // TODO: update metadata, e.g. if one line has some symbols, highlight its line number
      console.log('bind:', metadata);
      for (var i = 0, n = this.ui.lineNumber.children.length; i < n; i += 2) {
         var el = this.ui.lineNumber.children[i];
         el.classList.remove('active');
      }
      var map = {}, info;
      if (!metadata) return;
      info = metadata.symbol;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.comment;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      info = metadata.linkage;
      info && info.forEach(function (x) {
         if (!x.linenumber) return;
         map[x.linenumber] = true;
      });
      var that = this;
      Object.keys(map).forEach(function (lnstr) {
         var linenumber = parseInt(lnstr, 10);
         var el = that.ui.lineNumber.children[linenumber * 2 - 2];
         if (!el) return;
         // TODO: in future, more active-1, active-2, ...
         el.classList.add('active');
      });
   },
   getLine: function (linenumber) {
      if (isNaN(linenumber)) return null;
      if (linenumber <= 0) return null;
      if (linenumber > this.lines.length) return null;
      return this.lines[linenumber - 1];
   },
   computeCache: function () {
      for (var i = 0, n = this.ui.text.children.length; i < n; i++) {
         // span br span br span ...
         var el = this.ui.text.children[i];
         if (el.tagName.toLowerCase() === 'br') continue;
         if (this.cache.maxLineWidth < el.offsetWidth) {
            this.cache.maxLineWidth = el.offsetWidth;
         }
      }
   },
   lineHighlight: function (startLineNumber, endLineNumber) {
      // TODO: check start/end line number like in scrollToLine function
      var hL = this.ui.lineNumber.children[0].offsetHeight;
      var div = this.ui.extra.highlight.line;
      div.style.width = this.cache.maxLineWidth + 'px';
      var top = (startLineNumber - 1) * hL, bottom = (endLineNumber - 1) * hL;
      div.style.height = (bottom - top) + 'px';
      div.style.top = top + 'px';
      div.style.left = '0px';
      div.style.backgroundColor = 'yellow';
      div.style.display = 'block';
      this.ui.highlight.appendChild(div);
   },
   scrollToLine: function (startLineNumber, endLineNumber) {
      var n = this.lines.length;
      this.ui.extra.highlight.line.style.display = 'none';
      if (!startLineNumber || startLineNumber === endLineNumber) return;
      if (startLineNumber > endLineNumber) {
         startLineNumber += endLineNumber;
         endLineNumber = startLineNumber - endLineNumber;
         startLineNumber = startLineNumber - endLineNumber;
      }
      if (!endLineNumber) endLineNumber = startLineNumber + 1;
      if (startLineNumber < 0 || endLineNumber < 0) return;
      if (startLineNumber > n) return;
      if (endLineNumber > n + 1) return;

      var hL = this.ui.lineNumber.children[0].offsetHeight;
      var curTop = this.ui.container.scrollTop, curH = this.ui.container.offsetHeight;
      var top = (startLineNumber - 1) * hL, bottom = (endLineNumber - 1) * hL;
      var x = this.ui.container.scrollLeft;
      if (curTop > top) {
         this.ui.container.scrollTo(x, top);
      } else if (curTop + curH < bottom) {
         var y = top + curH - (bottom - top);
         if (y > top) y = top;
         this.ui.container.scrollTo(x, y);
      }
      this.lineHighlight(startLineNumber, endLineNumber);
   },
   dispose: function () {
      this.ui.lineNumber.removeEventListener('click', this.events.onClickLineNumber);
   }
};

if (!window.Flame) window.Flame = {};
window.Flame.editor = {
   SourceCodeViewer: SourceCodeViewer
};

})();
