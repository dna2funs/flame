'use strict';

(function (window, document) {


function debugRepeat(ch, n) {
   var str = '';
   for (var i = 0; i < n; i++) str += ch;
   return str;
}

// TODO: multiple request together
// do we cancel prev or bounce the request
// e.g. search, search, search
//           <-[cacel]<-[cancel]
// e.g. list,  list,  list
//          <-[wait]<-[wait]
var api = {
   user: {
      checkLogin: function () {
         return Promise.resolve(true);
      }, // checkLogin
      test: 0
   }, // user
   project: {
      getList: function () {
         var list = [];
         for (var i = 0, n = 50; i < n; i++) list.push({ name: 'test' + i + '/' });
         return Promise.resolve(list);
      }, // getList
      getDirectoryContents: function (path) {
         // e.g. convert / request to api.project.getList
         // otherwise get dir contents
         if (!path || path === '/') return api.project.getList();
         if (path && path.split('/').length > 20) {
            return Promise.resolve([
               { name: 'README.md' },
               { name: 'test.js' }
            ]);
         }
         return Promise.resolve([
            { name: 'next/' },
            { name: 'packge.json' },
            { name: 'README.md' }
         ]);
      }, // getDirectoryContents
      getFileContents: function (path) {
         return Promise.resolve({
            binary: false,
            data: (
               'This is a test readme file.\n\ntest for l' +
               debugRepeat('o', 200) +
               'ng line\n\n' +
               debugRepeat('\n', 70) +
               'test for scrollable'
            )
         });
      }, // getFileContents
      getMetadata: function (path, opt) {
         // TODO: load partially / on demand
         return Promise.resolve({
            // partial flag, [startLineNumber, endLineNumber]
            range: [1, 500],
            comment: [
               { user: 'flame', markdown: '`test` http://test.com/1', linenumber: 8 },
               { user: 'test', markdown: '`test` https://test.com/safe?test=1' }
            ],
            symbol: [
               { name: 'test', type: 'variable', linenumber: 5 }
            ],
            linkage: [
               {
                  ref: 'test', linenumber: 2,
                  in: { link: '/test0/README.md', tag: ['definition'], linenumber: 6 }
               },
               {
                  ref: 'test', linenumber: 2,
                  out: { link: '/test4/README.md', tag: ['reference'], linenumber: 20 }
               }
            ]
         });
      },
      search: function (query, n) {
         return Promise.resolve({
            matchRegexp: '[Tt]his is',
            items: [
               { path: '/test1/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' }
               ] },
               { path: '/test2/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' }
               ] },
               { path: '/test3/README.md', matches: [
                  { L: 1, T: 'This is a test readme file.' }
               ] }
            ]
         });
      } // search
   }, // project
   topic: {
      getMetadata: function (topic) {
         return Promise.resolve({
            name: 'this is a test topic',
            scope: 'public',
            item: [
               { path: '/test0/README.md', linenumber: 7 },
               { path: '/test1/package.json' }
            ],
            comment: [
               { user: 'flame', markdown: 'test topic' },
               { user: 'test', markdown: 'topic test' }
            ]
         });
      }
   } // topic
};

if (!window.Flame) window.Flame = {};
window.Flame.api = api;

})(window, document);
