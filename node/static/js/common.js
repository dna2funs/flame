'use strict';

window.genv = {
   hostname: window.location.hostname
};

function dom(selector) {
   return document.querySelector(selector);
}

function on(elem, name, fn) {
   return elem.addEventListener(name, fn);
}

function ajax(options, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest(), payload = null;
   xhr.open(
      options.method || 'POST',
      options.url + (options.data ? uriencode(options.data) : ''),
      true
   );
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response);
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   if (options.headers) {
      Object.keys(options.headers).forEach(function (key) {
         if (!options.headers[key]) return;
         xhr.setRequestHeader(key, options.headers[key]);
      });
   }
   if (options.json) {
      xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      payload = JSON.stringify(options.json);
   } else if (options.raw) {
      payload = options.raw;
   }
   xhr.send(payload);
   return xhr;
}

function html(url, done_fn, fail_fn) {
   var xhr = new XMLHttpRequest();
   xhr.open('GET', url, true);
   xhr.addEventListener('readystatechange', function (evt) {
      if (evt.target.readyState === 4 /*XMLHttpRequest.DONE*/) {
         if (~~(evt.target.status / 100) === 2) {
            done_fn && done_fn(evt.target.response || '<!-- empty -->');
         } else {
            fail_fn && fail_fn(evt.target.status);
         }
      }
   });
   xhr.send(null);
}

function download_uri(uri, name) {
   var link = document.createElement("a");
   link.download = name;
   link.href = uri;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
}

function download_uri_with_fetch(uri, name) {
   window.fetch(uri).then(function (res) {
      res.blob().then(function (blob) {
         var url = window.URL.createObjectURL(blob);
         download_uri(url, name);
         window.URL.revokeObjectURL(url);
      });
   });
}

function copy_text(text) {
   var textArea = document.createElement('textarea');
   textArea.style.position = 'fixed';
   textArea.style.top = '0px';
   textArea.style.left = '0px';
   textArea.value = text;
   document.body.appendChild(textArea);
   textArea.focus();
   textArea.select();
   try { document.execCommand('copy'); } catch (err) {}
   document.body.removeChild(textArea);
}

function get_cookie() {
   try {
      return JSON.parse(localStorage.getItem('cookie') || '{}');
   } catch (e) {
      return {};
   }
}

function set_cookie(key, value) {
   var obj = get_cookie();
   obj[key] = value;
   localStorage.setItem('cookie', JSON.stringify(obj));
}

function erase_cookie(key) {
   if (!key) {
      localStorage.removeItem('cookie');
      return;
   }
   var obj = get_cookie();
   delete obj[key];
   localStorage.setItem('cookie', JSON.stringify(obj));
}

function reload_on_hashchange() {
   window.addEventListener('hashchange', function () {
      window.location.reload(true);
   });
}

function encode_url_for_login(path) {
   var r = '/login.html#' + path + ':';
   if (window.location.hash) {
      r += window.location.hash.substring(1);
   }
   if (window.location.search) {
      r += window.location.search;
   }
   return r;
}

function remove_elem(elem) {
   elem.parentNode.removeChild(elem);
}

function empty_elem(elem) {
   while(elem.children.length) elem.removeChild(elem.children[0]);
   elem.innerHTML = '';
}

function dispose_component(component) {
   var elem = component.dom;
   remove_elem(elem);
   component.dom = null;
   component.ui = null;
}

function update_uuid(jsonData) {
   var obj = jsonData?JSON.parse(jsonData):{};
   if (obj.sessionId) set_cookie('uuid', obj.sessionId);
}

function is_mobile_browser() {
   var userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
   if (/android|iphone|ipod|kindle/.test(userAgent)) return true;
   return false;
}

function show_loading() {
   var div = dom('#pnl-loading');
   if (!div) {
      div = document.createElement('div');
      div.style.zIndex = '9999';
      div.style.position = 'fixed';
      div.style.width = '100%';
      div.style.height  = '100%';
      div.style.padding = '0';
      div.style.backgroundColor = 'white';
      div.style.opacity = '0.5';
      document.body.appendChild(div);
   }
   div.style.display = 'block';
}

function hide_loading() {
   var div = dom('#pnl-loading');
   if (!div) return;
   div.parentNode.removeChild(div);
}

//@include css/common.css
function elem_flash(el, count) {
   var sw = true;
   count = count || 5;
   _flash(el);

   function _flash(el) {
      if (count <= 0) return;
      if (sw) {
         el.classList.remove('item-invert');
      } else {
         el.classList.add('item-invert');
      }
      sw = !sw;
      count --;
      setTimeout(_flash, 200, el);
   }
}

function elem_append_text(el, text) {
   el.appendChild(document.createTextNode(text));
   return el;
}

function elem_append_html(el, html) {
   el.innerHTML += html;
   return el;
}

function detect_uuid_change(data) {
   if (!data) return;
   try {
   var obj = JSON.parse(data);
      if (obj.sessionId) set_cookie('uuid', obj.sessionId);
   } catch (err) {}
}

function login_and_start(redirect_url, env, before_init, init_app) {
   if (!redirect_url) redirect_url = 'login.html';
   before_init && before_init();
   var cookie = get_cookie();
   env = env || {};
   env.user = {
      user: cookie.user || '',
      uuid: cookie.uuid || ''
   };
   if (!env.user.user || !env.user.uuid) {
      window.location = redirect_url;
      return;
   }
   show_loading();
   ajax({
      url: '/auth/echotest',
      json: {
         user: env.user.user,
         uuid: env.user.uuid
      }
   }, function (data) {
      update_uuid(data);
      init_app && init_app();
      hide_loading();
   }, function () {
      window.location = redirect_url;
   });
}

