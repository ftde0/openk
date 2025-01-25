var nk = {};

nk.misc = {};
nk.misc.disable_button = function(button) {
  nk.misc.add_class(button,'type_disabled');
  button.disabled=true;
}
nk.misc.enable_button = function(button){
  nk.misc.remove_class(button,'type_disabled');
  button.disabled=false;
}
nk.misc.create_button = function(label) {
  var button = document.createElement('BUTTON');
  // button.type = 'button'; - IE na to nie pozwala :/
  button.className = "type_1";
  var table = document.createElement('TABLE');
  var tbody = document.createElement('TBODY');
  var row = document.createElement('TR');
  var cell = document.createElement('TD');
  cell.className = 'btn_l';
  row.appendChild(cell);
  cell = document.createElement('TD');
  cell.className = 'btn_m';
  cell.appendChild(document.createTextNode(label));
  row.appendChild(cell);
  cell = document.createElement('TD');
  cell.className = 'btn_r';
  row.appendChild(cell);
  tbody.appendChild(row);
  table.appendChild(tbody);
  button.appendChild(table);
  return button;
};

nk.misc.create_coolbox = function(width, left_label, right_label, inside, type, className) {
  var header_left = document.createElement('DIV');
  header_left.className = 'cool_box_header_left';
  if (left_label) {
    header_left.appendChild(left_label);
  }

  var header_right = document.createElement('DIV');
  header_right.className = 'cool_box_header_right';
  if (right_label) {
    header_right.appendChild(right_label);
  }

  var header_inner = document.createElement('DIV');
  header_inner.className = 'cool_box_header_inner';
  header_inner.appendChild(header_left);
  header_inner.appendChild(header_right);

  var header = document.createElement('DIV');
  header.className = 'cool_box_header';
  header.appendChild(header_inner);

  var inner = document.createElement('DIV');
  inner.className = 'cool_box_inner';
  if (inside) {
    inner.appendChild(inside);
  }

  var content = document.createElement('DIV');
  content.className = 'cool_box_content';
  content.appendChild(inner);

  var box = document.createElement('DIV');
  box.className = 'cool_box cool_box_' + type;
  if (className) {
    box.className += ' ' + className;
  }
  box.appendChild(header);
  box.appendChild(content);
  box.style.width = width;

  return box;
};

nk.misc.decode_utf8 = function(s) {
  return decodeURIComponent(escape(s)); // Nice hack :D
};

nk.misc.encode_utf8 = function(s) {
  return unescape(encodeURIComponent(s)); // Nice hack :D
};

nk.misc.repair_utf8 = function(s) {
  if (s.charCodeAt(0) == 0xfeff) { // na początku BOM w Unicodzie - wycinamy go
    return s.substr(1);
  }
  if (s.charCodeAt(0) == 0xef && s.charCodeAt(1) == 0xbb && s.charCodeAt(2) == 0xbf) { // na początku BOM w UTF-8
    return nk.misc.decode_utf8(s.substr(3)); // musimy sami zdekodować - głupia przeglądarka...
  }
  return s;
};

nk.misc.add_event = function(obj, name, handler, dom_only) {
  if (!obj) return;
  if (dom_only && !nk.misc.dom) return;
  var cur = obj['on' + name];
  if (!cur || !cur.nk$handlers) {
    obj['on' + name] = arguments.callee.create_handler([]);
    if (cur) obj['on' + name].nk$handlers[0] = cur;
  }
  obj['on' + name].nk$handlers[obj['on' + name].nk$handlers.length] = handler;
};
nk.misc.add_event.create_handler = function(handlers) {
  var handler = function(e) {
    var ev = e ? e : window.event;
    for (var i = 0; i < handlers.length; i++) {
      var res = handlers[i].call(this, ev);
      if (res === false) return false;
    }
    return true;
  };
  handler.nk$handlers = handlers;
  return handler;
};

nk.misc.request = (function() {
  var s = window.location.search;
  if (s === '') return {};
  s = s.slice(1);
  var r = s.split(/[&;]/);
  var res = {};
  for (var i = 0; i < r.length; i++) {
    var j = r[i].indexOf('=');
    if (j == -1) continue;
    var name = decodeURIComponent(r[i].slice(0, j));
    var value = decodeURIComponent(r[i].slice(j+1));
    res[name] = value;
  }
  return res;
})();

nk.misc.dom = !!document.getElementById;
nk.misc.ie = navigator.appName == "Microsoft Internet Explorer";

nk.misc.ondomready = null;

(function() {
  var dom_ready = function() {
    if (arguments.callee.done) {
      return;
    }
    arguments.callee.done = true;
    if (nk.misc.ondomready) {
      nk.misc.ondomready({});
    }
  }
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', dom_ready, false);
  }
  nk.misc.add_event(document, 'readystatechange', function() {
    if (/^(complete|loaded)$/.test(document.readyState)) {
      dom_ready();
    }
  });
  nk.misc.add_event(window, 'load', dom_ready);
})();

nk.misc.has_class = function(element, class_name) {
  if (!element) return false;
  var cn = element.className;
  if (!cn) return false;
  if (cn == class_name) return true;
  var re = new RegExp('(^|\\s)' + class_name + '(\\s|$)');
  return re.test(cn);
};

nk.misc.add_class = function(element, class_name) {
  if (!element) return;
  var cn = element.className;
  if (!cn) {
    element.className = class_name;
  } else if (!this.has_class(element, class_name)) {
    element.className += ' ' + class_name;
  }
};

nk.misc.remove_class = function(element, class_name) {
  if (!element) return;
  var cn = element.className;
  if (!cn) return;
  var re = new RegExp('(^|\\s+)' + class_name + '\\b', 'g');
  element.className = cn.replace(re, '');
};

nk.misc.process_checkboxes = function(form, check)
{
  for (var i = 0; i < form.length; i++) {
    if ('checkbox' === form[i].type) {
      form[i].checked = false;
    }
  }
  
  for (var i = 2; i < arguments.length; i++) {
    if ('checkbox' === form[arguments[i]].type) {
      form[arguments[i]].checked = check;
    }
  }
}

nk.misc.process_checkboxes_all = function(form, check)
{
  for (var i = 0; i < form.length; i++) {
    if ('checkbox' === form[i].type) {
      form[i].checked = check;
    }
  }
}

nk.misc.process_checkboxes_all_reverse = function(form)
{
  for (var i = 0; i < form.length; i++) {
    if ('checkbox' === form[i].type) {
      if (form[i].checked === true) {
        form[i].checked = false;
      }
      else {
        form[i].checked = true;
      }
    }
  }
}

if (typeof encodeURIComponent == 'undefined') self.encodeURIComponent = escape;
if (typeof decodeURIComponent == 'undefined') self.decodeURIComponent = unescape;

nk.misc.print_with_wbr = function(str, num) {
  if(str == null) {
    return str;
  }
  var wbr_str = str.replace(RegExp("(\\S{" + num + "})(\\S)", "g"), function(all){
    return all + "~wbr~";
  });
  wbr_str = wbr_str.replace(/\n/g, '~~nl~~\n');
  var ent_str = htmlentities(wbr_str);
  ent_str = ent_str.replace(/~~nl~~/g, '<br>\n');
  return ent_str.replace(/~wbr~/g, '<wbr>');
}

nk.session = {DEFAULT_TYPE: 0, SLEDZIK_TYPE:1};

nk.misc.show_hide_div = function(elem_id)
{
  var elem = document.getElementById(elem_id);
  if (!elem) { 
    return false;
  }
  if (elem.style.display != 'block') {
    elem.style.display = 'block';
  }
  else {
    elem.style.display = 'none';
  }
}

// kompatybilność wstecz:
var misc_create_button = nk.misc.create_button;
var misc_create_coolbox = nk.misc.create_coolbox;
var misc_decode_utf8 = nk.misc.decode_utf8;
var misc_encode_utf8 = nk.misc.encode_utf8;
var misc_repair_utf8 = nk.misc.repair_utf8;
