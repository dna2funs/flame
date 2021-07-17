'use strict';
//@include js/common.js
//@include js/api.js
//@include js/treeview.js
//@include js/markdown.js
//@include js/editor.js
//@include js/analysis.js
//@include js/collector.js

(function () {

var ui = {
   btn: {
      nav: {
         search: dom('#btn-search'),
         browse: dom('#btn-browse'),
         analysis: dom('#btn-analysis'),
         team: dom('#btn-team'),
         settings: dom('#btn-settings')
      },
      search: {
         act: dom('#search_btn-search')
      }
   }, // btn
   txt: {
      search: {
         query: dom('#search_txt-search')
      }
   }, // txt
   panel: {
      side: dom('#pnl-side'),
      search: dom('#pnl-side-search'),
      search_result: dom('#search_pnl-item'),
      browse: dom('#pnl-side-browse'),
      browse_tree: dom('#browse_pnl-tree'),
      analysis: dom('#pnl-side-analysis'),
      analysis_result: dom('#analysis_pnl-item'),
      team: dom('#pnl-side-team'),
      settings: dom('#pnl-side-settings'),
      title: dom('#pnl-title'), // e.g. show breadcrumb
      contents: dom('#pnl-contents'), // e.g. show source code
      mask: dom('.mask')
   }, // panel
   label: {
      username: dom('#lbl-username')
   }, // label
   state: {
      show: function (el) { el.style.display = 'block'; },
      hide: function (el) { el.style.display = 'none'; },
      empty: function (el) { empty_elem(el); },
      flash: function (el, count) { elem_flash(el, count); },
      append_text: function (el, text) { elem_append_text(el, text); },
      div_message: function (msg, color) {
         var div = document.createElement('div');
         div.className = 'item item-' + (color || 'red');
         div.appendChild(document.createTextNode(msg));
         return div;
      },
      nav: {
         selected: null,
         select: function (el) { el.classList.add('active'); },
         deselect: function (el) { el.classList.remove('active'); }
      },
      treeview: {
         scroll_to: function (el) {
            if (ui.state.nav.selected !== 'browse') return;
            var top = el.offsetTop - ui.panel.side.offsetTop;
            var top0 = ui.panel.side.scrollTop;
            var h = el.offsetHeight;
            var h0 = ui.panel.side.offsetHeight;
            var x = ui.panel.side.scrollLeft;
            if (top0 > top) {
               ui.panel.side.scrollTo(x, top);
            } else if (top0 + h0 - h < top) {
               var y = top - h0 + h;
               if (y < 0) y = 0;
               ui.panel.side.scrollTo(x, y);
            }
         }
      },
      label: {
         text: function (el, val) {
            el.innerHTML = '';
            el.appendChild(document.createTextNode(val));
         }
      }, // label
      global: {
         bookmark: [],
         editor: null,
         metadata: null,
         lastHash: {}
      },
      const: {
         pre_font: null
      }
   }
};

function parseHash() {
   // hash format:
   //   - #/path/to/sth
   //   - #?searchQuery
   //   - #...#k1=v1#k2=v2...
   var parts = location.hash.split('#');
   parts.shift();
   var obj = {};
   obj.path = parts[0];
   parts.shift();
   parts.forEach(function (part) {
      var kv = part.split('=');
      obj[decodeURIComponent(kv[0] || '.')] = decodeURIComponent(kv[1] || '');
   });
   return obj;
}

function buildHash(changes) {
   var obj = ui.state.global.lastHash;
   if (!obj) return '#';
   obj = Object.assign({}, obj, changes);
   var path = obj.path;
   delete obj.path;
   var hash = '#' + path;
   Object.keys(obj).forEach(function (key) {
      if (!obj[key]) return;
      hash += '#' + encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
   });
   return hash;
}

function analysisShowBookmark(data) {
   var name = 'flame://bookmark';
   var block = ui.panel.analysis_result.getBlock(name);
   if (block) {
      ui.panel.analysis_result.showBlock(name, 'bookmark', data);
   } else {
      ui.panel.analysis_result.showBlock(name, 'bookmark', data, {
         disableClose: true,
         onReset: function (self, obj) {
            var div;
            if (!obj || !obj.items || !obj.items.length) {
               div = document.createElement('div');
               div.className = 'item item-red';
               ui.state.append_text(div, 'No Item');
               self.ui.content.appendChild(div);
               return;
            }
            // TODO: render bookmark items
         }
      });
   }
}

function analysisBuildNoContent(block, text) {
   block.reset();
   block.ui.content.appendChild(ui.state.div_message(text || 'No Contents'));
}

function analysisBuildMetadata(obj, subblock) {
   var hash = parseHash();
   var symbols, comments, linkages;
   symbols = obj && obj.symbol || [];
   comments = obj && obj.comment || [];
   linkages = obj && obj.linkage || [];
   if (obj.linenumber) {
      symbols = symbols.filter(function (x) { return x.linenumber === obj.linenumber; });
   }
   comments = comments.filter(function (x) { return x.linenumber === obj.linenumber; });
   linkages = linkages.filter(function (x) { return x.linenumber === obj.linenumber; });
   if (symbols.length) {
      subblock.symbol.reset();
      symbols.forEach(function (symbol) {
         var div = document.createElement('div');
         div.className = 'item-thin item-blue';
         if (hash.path && hash.path.startsWith('/') && symbol.linenumber) {
            var a = document.createElement('a');
            ui.state.append_text(a, '' + symbol.linenumber);
            a.href = '#' + hash.path + '#L=' + symbol.linenumber;
            div.appendChild(a);
         }
         ui.state.append_text(div, ' ' + symbol.name + ' (' + symbol.type + ')');
         subblock.symbol.ui.content.appendChild(div);
      });
   } else {
      analysisBuildNoContent(subblock.symbol, 'No symbol');
   }
   if (comments.length) {
      subblock.comment.reset();
      comments.forEach(function (comment) {
         var div = document.createElement('div');
         div.className = 'item-thin item-blue';
         if (hash.path && hash.path.startsWith('/') && comment.linenumber) {
            var a = document.createElement('a');
            ui.state.append_text(a, '' + comment.linenumber);
            a.href = '#' + hash.path + '#L=' + comment.linenumber;
            div.appendChild(a);
         }
         ui.state.append_text(div, ' ' + comment.user + ': ')
         var md = new Flame.component.MarkDown();
         md.render(comment.markdown);
         div.appendChild(md.dom());
         subblock.comment.ui.content.appendChild(div);
      });
   } else {
      analysisBuildNoContent(subblock.comment, 'No comment');
   }
   if (linkages.length) {
      subblock.linkage.reset();
      linkages.forEach(function (linkage) {
         var sub, direction = '';
         if (linkage.in) {
            sub = linkage.in;
            direction = ' <-- ';
         } else if (linkage.out) {
            sub = linkage.out;
            direction = ' --> ';
         } else {
            // TODO: not sure what to show yet
            sub = null
         }
         if (!sub) return;
         var div = document.createElement('div');
         div.className = 'item-thin item-blue';
         ui.state.append_text(div, (linkage.ref || 'O') + direction);
         var a = document.createElement('a');
         var link = sub.link.split('/').pop(), href = '#' + sub.link;
         if (sub.linenumber) {
            link += '#' + sub.linenumber;
            href += '#L=' + sub.linenumber;
         }
         ui.state.append_text(a, link);
         a.href = href;
         div.appendChild(a);
         subblock.linkage.ui.content.appendChild(div);
      });
   } else {
      analysisBuildNoContent(subblock.linkage, 'No link');
   }
}

function analysisShowMetadata(data) {
   var name = 'flame://metadata';
   var block = ui.panel.analysis_result.getBlock(name);
   if (block) {
      ui.panel.analysis_result.showBlock(name, 'metadata', data);
   } else {
      var block = ui.panel.analysis_result.showBlock(name, 'metadata', data, {
         disableClose: false,
         onReset: function (self, obj) {
            if (obj && obj.loading) {
               self.loading();
               return;
            }
            self.ui.subblock = {
               symbol: new Flame.component.AnalysisBlock('symbol', { disableClose: true }),
               comment: new Flame.component.AnalysisBlock('comment', { disableClose: true }),
               linkage: new Flame.component.AnalysisBlock('linkage', { disableClose: true }),
            };
            if (!self.ui.subblock.symbol.dom().parentNode) {
               self.ui.content.appendChild(self.ui.subblock.symbol.dom());
               self.ui.content.appendChild(self.ui.subblock.comment.dom());
               self.ui.content.appendChild(self.ui.subblock.linkage.dom());
            }
            analysisBuildMetadata(obj, self.ui.subblock);
            var div;
            var name = ui.state.global.lastHash.path.split('/').pop();
            if (obj.linenumber) {
               div = document.createElement('div');
               div.className = 'item-thin item-yellow';
               ui.state.append_text(div, name + '#' + obj.linenumber);
               self.ui.content.insertBefore(div, self.ui.content.children[0]);
            } else {
               // TODO: show metadata for file
               div = document.createElement('div');
               div.className = 'item-thin item-yellow';
               ui.state.append_text(div, name);
               self.ui.content.insertBefore(div, self.ui.content.children[0]);
            }
            self.ui.subblock.symbol.show();
            self.ui.subblock.comment.show();
            self.ui.subblock.linkage.show();
         },
         onDispose: function (self) {
            if (self.ui.subblock) {
               self.ui.subblock.symbol.dispose();
               self.ui.subblock.comment.dispose();
               self.ui.subblock.linkage.dispose();
            }
         }
      });
   }
}

function analysisGotoMetadata(linenumber) {
   if (ui.state.nav.selected !== 'analysis') {
      onSwitchSidePanel({ target: ui.btn.nav.analysis });
   }
   ui.panel.analysis_result.fold('flame://metadata');
   var obj = ui.state.global.metadata;
   if (linenumber) {
      obj.linenumber = linenumber;
   } else {
      delete obj.linenumber;
   }
   analysisShowMetadata(obj);
   ui.panel.analysis_result.unfold('flame://metadata');
   ui.panel.analysis_result.scrollToBlock('flame://metadata');
   var block = ui.panel.analysis_result.getBlock('flame://metadata');
   ui.state.flash(block.dom());
}

function editorGotoLine (obj) {
   var editor = ui.state.global.editor;
   if (!editor) return;
   if (!editor.scrollToLine) return;
   var parts = (obj.L || '0').split('-');
   var st = parseInt(parts[0], 10);
   var ed = parts[1]?parseInt(parts[1], 10):undefined;
   editor.scrollToLine(st, ed);
}

function editorBindMetadata (metadata) {
   var editor = ui.state.global.editor;
   if (!editor) return;
   if (!editor.bindMetadata) return;
   editor.bindMetadata(metadata);
}

function renderMetadataBlock(path, obj) {
   ui.state.global.metadata = obj;
   analysisShowMetadata(obj);
   ui.panel.analysis_result.unfold('flame://metadata');
}

/*
<div class="item-thin item-blue">
   <a>{path}</a>
   <div class="flex-table flex-row item-thin item-purple">
      <div class="editor-linenumber" style="font: 13px monospace;"><a>{line-number}</a></div>
      <pre class="editor-text flex-auto"><a>{matched-text}</a></pre>
   </div>
</div>
 */
function renderSearchItem(item, opt) {
   var div = document.createElement('div');
   div.className = 'item-thin item-blue search-item';
   var a = document.createElement('a');
   ui.state.append_text(a, item.path);
   a.href = '#' + item.path;
   if (!item.matches || !item.matches.length) {
      return div;
   }
   var match = document.createElement('div');
   match.className = 'item-thin item-purple';
   match.style.width = '100%';
   match.style.overflowX = 'auto';
   var lineno = document.createElement('div');
   lineno.className = 'editor-left-side';
   lineno.style.fontFamily = ui.state.const.pre_font.family;
   lineno.style.fontSize = ui.state.const.pre_font.size;
   var pre = document.createElement('pre');
   pre.className = 'editor-text flex-auto';
   item.matches.forEach(function (match, i) {
      if (i > 0) {
         lineno.appendChild(document.createElement('br'));
         pre.appendChild(document.createElement('br'));
      }
      var a = document.createElement('a');
      var span = document.createElement('a');
      ui.state.append_text(a, match.L);
      ui.state.append_text(span, match.T);
      span.href = '#' + item.path + '#L' + match.L;
      lineno.appendChild(a);
      pre.appendChild(span);
   });
   div.appendChild(a);
   match.appendChild(lineno);
   match.appendChild(pre);
   div.appendChild(match);
   return div;
}

function renderSearchItems(result) {
   ui.state.empty(ui.panel.search_result);
   if (!result.items || !result.items.length) {
      ui.panel.search_result.appendChild(ui.state.div_message('Search result: nothing found.'));
      return;
   }
   var opt = {};
   // TODO: add options to opt object, e.g. opt.regexp = result.matchRegexp
   result.items.forEach(function (item) {
      ui.panel.search_result.appendChild(renderSearchItem(item, opt));
   });
}

function renderNotSupportFileView(obj) {
   ui.state.empty(ui.panel.contents);
   var div = document.createElement('div');
   div.className = 'item item-red';
   var img = document.createElement('img');
   img.src = 'img/exclamation.svg';
   img.style.width = '18px';
   img.style.height = '18px';
   div.appendChild(img);
   ui.state.append_text(div, ' binary file view NOT supported yet!');
   ui.panel.contents.appendChild(div);
   return { dispose: function () {} };
}

function renderBreadcrumb(path) {
   var parts = path.split('/');
   parts.shift();
   var last = parts.pop();
   if (!last) last = parts.pop();
   if (!last) return;
   ui.state.append_text(ui.panel.title, '# / ');
   var curpath = '/';
   parts.forEach(function (name) {
      curpath += name + '/';
      var a = document.createElement('a');
      ui.state.append_text(a, name);
      a.href = '#' + curpath;
      a.setAttribute('data-path', curpath);
      ui.panel.title.appendChild(a);
      ui.state.append_text(ui.panel.title, ' / ')
   });
   ui.state.append_text(ui.panel.title, last);
}

function onHashChange() {
   var obj = parseHash();
   if (obj.path) {
      if (obj.path.startsWith('/')) {
         if (obj.path === ui.state.global.lastHash.path) {
            editorGotoLine(obj);
            // TODO: check sub hash change, e.g. line number selected
            // TODO: how to deal with multiple line, like 1-5
            analysisGotoMetadata(obj.L?parseInt(obj.L.split('-'), 10):null);
         } else {
            ui.panel.browse_tree.asyncExpandTo(obj.path);
            if (ui.state.global.editor) ui.state.global.editor.dispose();
            ui.state.empty(ui.panel.contents);
            ui.state.empty(ui.panel.title);
            renderBreadcrumb(obj.path);
            if (!obj.path.endsWith('/')) {
               onView(obj.path).then(function () {
                  editorGotoLine(obj);
                  onMetadata(obj.path, obj.L?parseInt(obj.L.split('-'), 10):null).then(
                     function (metadata) { editorBindMetadata(metadata); },
                     function () {}
                  );
               });
            }
         }
      } else if (obj.path.startsWith('?')) {
         var query = decodeURIComponent(obj.path.substring(1));
         onSearch(query);
         if (ui.state.nav.selected !== 'search') {
            onSwitchSidePanel({ target: ui.btn.nav.search });
         }
      }
   }
   ui.state.global.lastHash = obj;
}

function onSwitchSidePanel(evt) {
   var id = evt.target.getAttribute('id').split('-')[1];
   if (!id) return;
   if (ui.state.nav.selected === id) {
      ui.state.nav.selected = null;
      ui.state.hide(ui.panel.side);
      ui.state.nav.deselect(ui.btn.nav[id]);
   } else {
      var all = ['search', 'browse', 'analysis', 'team', 'settings'];
      all.forEach(function (one) {
         ui.state.hide(ui.panel[one]);
         ui.state.nav.deselect(ui.btn.nav[one]);
      });
      ui.state.nav.select(ui.btn.nav[id]);
      ui.state.show(ui.panel[id]);
      ui.state.show(ui.panel.side);
      ui.state.nav.selected = id;
   }
}

function onView(path, opt) {
   if (!opt) opt = {};
   // TODO: locate to sepcified line number
   if (ui.state.global.editor) ui.state.global.editor.dispose();
   ui.state.empty(ui.panel.contents);
   var req = Flame.api.project.getFileContents(path)
   req.then(
      function (obj) {
         var editor;
         if (obj.binary) {
            editor = renderNotSupportFileView(obj);
         } else {
            editor = new Flame.editor.SourceCodeViewer(ui.panel.contents, obj.data, {
               onClickLineNumber: function (linenumber) {
                  var hash = parseHash();
                  var lnstr = '' + linenumber;
                  if (hash.L === lnstr) {
                     // deselect the line
                     window.location.hash = buildHash({ L: null });
                  } else {
                     window.location.hash = buildHash({ L: lnstr });
                  }
               }
            });
         }
         ui.state.global.editor = editor;
      },
      function (err) {}
   );
   return req;
}

function onSearch(query) {
   // TODO: handle prev query processing, e.g. cancel, parallel
   ui.txt.search.query.value = query;
   ui.state.empty(ui.panel.search_result);
   // TODO: convert to code instead of html string
   ui.panel.search_result.innerHTML = '<div><span class="spin spin-sm"></span> Searching ...</div>';
   var req = Flame.api.project.search(query)
   req.then(
      function (result) {
         renderSearchItems(result);
      },
      function () {
         // TODO: handle errors
      }
   );
   return req;
}

function onSearchFromBtn(evt) {
   var query = ui.txt.search.query.value;
   if (!query) {
      ui.txt.search.query.focus();
      return;
   }
   location.hash = '#?' + encodeURIComponent(query);
   // hashchange -> onSearch(query);
}

function onSearchFromInput(evt) {
   if (evt.code !== 'Enter') return;
   var query = ui.txt.search.query.value;
   if (!query) return;
   location.hash = '#?' + encodeURIComponent(query);
   // hashchange -> onSearch(query);
}

function onClickBreadcrumb(evt) {
   if (evt.target.tagName.toLowerCase() !== 'a') return;
   if (!evt.ctrlKey && !evt.shiftKey && !evt.altKey) {
      evt.preventDefault();
   }
   var path = evt.target.getAttribute('data-path');
   if (!path) return;
   ui.panel.browse_tree.asyncExpandTo(path);
}

function onMetadata(path, linenumber) {
   // TODO: if change to new file, cancel prev req
   // TODO: deal with large file with lots of metadata
   analysisShowMetadata({ loading: true });
   var req = Flame.api.project.getMetadata(path);
   req.then(
      function (obj) {
         if (linenumber) obj.linenumber = linenumber;
         renderMetadataBlock(path, obj);
      },
      function (err) {}
   );
   return req;
}

function initEvent() {
   window.addEventListener('hashchange', onHashChange);
   ui.btn.nav.search.addEventListener('click', onSwitchSidePanel);
   ui.btn.nav.browse.addEventListener('click', onSwitchSidePanel);
   ui.btn.nav.analysis.addEventListener('click', onSwitchSidePanel);
   ui.btn.nav.team.addEventListener('click', onSwitchSidePanel);
   ui.btn.nav.settings.addEventListener('click', onSwitchSidePanel);
   ui.btn.search.act.addEventListener('click', onSearchFromBtn);
   ui.txt.search.query.addEventListener('keypress', onSearchFromInput);
   ui.panel.title.addEventListener('click', onClickBreadcrumb);
}

function initComponent() {
   var cookie = get_cookie();
   ui.state.label.text(ui.label.username, cookie.user || '(flame)');
   // TODO: if cookie.user is empty

   ui.panel.browse_tree = new Flame.component.FolderTree(ui.panel.browse_tree, {
      switchToBrowseTab: function () {
         if (ui.state.nav.selected !== 'browse') {
            onSwitchSidePanel({ target: ui.btn.nav.browse });
         }
      },
      highlightItem: function (elem) {
         ui.state.treeview.scroll_to(elem);
         ui.state.flash(elem);
      }
   });
   ui.panel.browse_tree.root.asyncUnfold();

   ui.panel.analysis_result = new Flame.component.AnalysisBlockManager(
      ui.panel.analysis_result
   );
   analysisShowBookmark();

   onHashChange();

   var pre = document.createElement('pre');
   document.body.appendChild(pre);
   var pre_style = getComputedStyle(pre);
   ui.state.const.pre_font = {
      family: pre_style.fontFamily,
      size: pre_style.fontSize
   };
   document.body.removeChild(pre);
}

function initApplication() {
   Flame.api.user.checkLogin().then(
      function () {
         initComponent();
         initEvent();
      },
      function () {
         // if 401, redirect to login page
         // otherwise, message server error
      }
   );
}

initApplication();

})();
