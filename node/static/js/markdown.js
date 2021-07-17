'use strict';

//@include js/common.js

(function () {

function MarkDown() {
   this.self = document.createElement('div');
   // TODO: shadow element for standalone style sheet?
}
MarkDown.prototype = {
   dom: function () { return this.self; },
   render: function (text) {
      empty_elem(this.self);
      // TODO: state machine to extract markdown syntax tree
      //       and then build html
      var words = text.split(/\s/);
      for (var i = 0, n = words.length; i < n; i++) {
         var word = words[i];
         if (/^\w+:\/\/([\w\-]+\.)+[\w\-]+.*$/.test(word)) {
            var a = document.createElement('a');
            elem_append_text(a, word);
            a.href = word;
            this.self.appendChild(a);
         } else {
            this.self.appendChild(document.createTextNode(word + ' '));
         }
      }
   },
   dispose: function () {}
};

if (!window.Flame) window.Flame = {};
window.Flame.component = Object.assign(window.Flame.component || {}, {
   MarkDown: MarkDown
});

})();
