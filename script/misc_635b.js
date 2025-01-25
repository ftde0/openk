if (window != window.parent) {
  try {
    var hash = window.parent.hash;    
  } catch (e) {
    if(nk_options.verifier) {
      try {
        $(window).addEvent('bodystart_nk', function() {
          new DomainVerifier(window.location.host).verify(); 
        });
      } catch(e) {
        window.parent.location = window.location;
      }
    } else {
      window.parent.location = window.location;
    }
  }
}

function misc_create_button(label)
{
  var button = document.createElement('BUTTON');
  // button.type = 'button'; - IE na to nie pozwala :/
  button.className = "type_1";
  var table = document.createElement('TABLE');
  var tbody = document.createElement('TBODY');
  var row = document.createElement('TR');
  var cell = document.createElement('TD');
  cell.className = "btn_l";
  row.appendChild(cell);
  cell = document.createElement('TD');
  cell.className = "btn_m";
  cell.appendChild(document.createTextNode(label));
  row.appendChild(cell);
  cell = document.createElement('TD');
  cell.className = "btn_r";
  row.appendChild(cell);
  tbody.appendChild(row);
  table.appendChild(tbody);
  button.appendChild(table);
  return button;
}

function misc_create_coolbox(width, left_label, right_label, inside, type, className)
{
  var header_left = document.createElement('DIV');
  header_left.className = 'cool_box_header_left';
  if (left_label) header_left.appendChild(left_label);

  var header_right = document.createElement('DIV');
  header_right.className = 'cool_box_header_right';
  if (right_label) header_right.appendChild(right_label);

  var header_inner = document.createElement('DIV');
  header_inner.className = 'cool_box_header_inner';
  header_inner.appendChild(header_left);
  header_inner.appendChild(header_right);

  var header = document.createElement('DIV');
  header.className = 'cool_box_header';
  header.appendChild(header_inner);

  var inner = document.createElement('DIV');
  inner.className = 'cool_box_inner';
  if (inside) inner.appendChild(inside);

  var content = document.createElement('DIV');
  content.className = 'cool_box_content';
  content.appendChild(inner);

  var box = document.createElement('DIV');
  box.className = 'cool_box cool_box_' + type;
  if (className) box.className += ' ' + className;
  box.appendChild(header);
  box.appendChild(content);
  box.style.width = width;

  return box;
}

// add string trim functions
String.prototype.ltrim = function(){
  return this.replace(/^\s+/, '');
}

String.prototype.rtrim = function(){
  return this.replace(/\s+$/, '');
}

String.prototype.trim = function(){
  return this.rtrim().ltrim();
}
String.prototype.get_demo_prefix = function(n, first_cut, cut_every) 
{
  if(this.length > n+3) {
    return (first_cut ? break_string(this.substr(0,n), first_cut, cut_every) : htmlentities(this.substr(0,n))) + '&hellip;';
  }

  return first_cut ? break_string(this, first_cut, cut_every) : htmlentities(this);
}

function misc_encode_utf8(s)
{
  return unescape(encodeURIComponent(s)); // Nice hack :D
}

function misc_decode_utf8(s)
{
  return decodeURIComponent(escape(s)); // Nice hack :D
}

function misc_repair_utf8(s)
{
  if (s.charCodeAt(0) == 0xfeff) { // na początku BOM w Unicodzie - wycinamy go
    return s.substr(1);
  }
  if (s.charCodeAt(0) == 0xef && s.charCodeAt(1) == 0xbb && s.charCodeAt(2) == 0xbf) { // na początku BOM w UTF-8
    return misc_decode_utf8(s.substr(3)); // musimy sami zdekodować - głupia przeglądarka...
  }
  return s;
}
function htmlentities(s){
  // http://kevin.vanzonneveld.net
  // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
 
  var div = document.createElement('div');
  var text = document.createTextNode(s);
  div.appendChild(text);
  return div.innerHTML;
}
function break_string(t,first_cut,cut_every){
  var nwc=0;
  var res='';
  var todo='';
  for(var i=0;i<t.length;i++){
    var c=t.charAt(i);
    if(c==' ' || c=='\t' || c=='\n'){
      nwc=0;
    }else{
      if(nwc>=first_cut && 0==(nwc-first_cut)%cut_every){
        res+=htmlentities(todo)+'<wbr></wbr>';        
        todo='';
      }
      nwc++;
    }
    todo+=c;
  }
  return res+htmlentities(todo);
}
RegExp.escape = function(t){                    
  return t.replace(/[$\^?*+()\/.|[\]{}]/g,'\\$&');
}

function byId(id) {
  if (document.getElementById)
    var returnVar = document.getElementById(id);
  else if (document.all)
    var returnVar = document.all[id];
  else if (document.layers)
    var returnVar = document.layers[id];
  return returnVar;
}
function getStaticUri(file)
{
  file += ''; // convert to string
  file = file.charAt(0) != '/' ? file : file.substr(1);
  return nk_options.servers.static_uri + file;
}

function add_notification(text, type) {
  if( typeof(MooTools) == 'undefined' ) return;
  //mootools reqiured
  var notif_box = new Element('div', {
    'class' : 'notification' + (type!=null ? ' notification_' + type : ''),
    'html' : text
  });
  var path = $('path');
  if ( path != null ) {
    notif_box.inject(path, 'after');
  } else {
    notif_box.inject($('content_main'), 'top');
  }
  fade_effect = new Fx.Morph(notif_box, {duration: 'long'});
  fade_effect.addEvent('complete', function(){
    notif_box.dispose();
  });
  setTimeout(function () {
    fade_effect.start({opacity : 0, height : 0, 'margin-bottom' : 0, 'padding-bottom' : 0, 'padding-top' : 0});
  }, 2000);
}

var xbox={
  "expandable_boxes":["schools","mail","forum","media","services"],
  "schools":0,
  "mail":1,
  "forum":2,
  "media":3,
  "services":4,
  "zwin_img":null,
  "rozwin_img":null,
  "images_info":[
                  {rozwin: 'img/button_rozwin_blue.gif', zwin: 'img/button_zwin_blue.gif', width: '47'},
                  {rozwin: 'img/button_rozwin_light_blue.gif', zwin: 'img/button_zwin_light_blue.gif', width: '51'}
                ], 
  "images_ids": [0, 0, 0, 0, 1]
};

xbox.x=GetCookie('x')||0;

xbox.init_img=function(){
  xbox.zwin_img = new Array();
  xbox.rozwin_img = new Array();
  for(var i=0 ; i< xbox.images_ids.length; i++) {
   var img_z = new Image();
       img_z.src = getStaticUri(xbox.images_info[xbox.images_ids[i]].zwin);
   var img_r= new Image();
       img_r.src = getStaticUri(xbox.images_info[xbox.images_ids[i]].rozwin);
      
   xbox.zwin_img.push(img_z);
   xbox.rozwin_img.push(img_r);
  }
}

xbox.save=function(){
  SetCookie('x',xbox.x);
}
xbox.get_shorter=function(id){
  return byId(xbox.expandable_boxes[id]+"_min");
}
xbox.get_full=function(id){
  return byId(xbox.expandable_boxes[id]+"_max");
}
xbox.get_button=function(id){
  return byId("rozwin_"+xbox.expandable_boxes[id]);
}
xbox.get_img=function(id){
  return byId(xbox.expandable_boxes[id]+"_minmax_button");
}
xbox.is_expanded=function(id){
  return xbox.x&1<<id;
}
xbox.set=function(id){
  xbox.x|=1<<id;
  xbox.save();
}
xbox.clear=function(id){
  xbox.x&=~(1<<id);
  xbox.save();
}
xbox.expand=function(id) {
  var img=xbox.get_img(id);
  if(null==xbox.zwin_img){
    xbox.init_img();
  }
  img.src = xbox.zwin_img[id].src;

  img.height = 15;
  img.width = xbox.images_info[xbox.images_ids[id]].width;
  var shorter = xbox.get_shorter(id);
  if(shorter) { 
    shorter.style.display = 'none';
  }
  var full = xbox.get_full(id);
  if(full) {
    full.style.display = 'block';
  }
  xbox.set(id);
  return false;
}
xbox.collapse=function(id) {
  var img=xbox.get_img(id);
  if(null==xbox.zwin_img){
    xbox.init_img();
  }
  
  img.src = xbox.rozwin_img[id].src;
 
  img.height = 15;
  img.width = xbox.images_info[xbox.images_ids[id]].width;
  var shorter = xbox.get_shorter(id);
  if(shorter) { 
    shorter.style.display = 'block';
  }
  var full = xbox.get_full(id);
  if(full) {
    full.style.display = 'none';
  }
  xbox.clear(id);
  return false;
}
xbox.toogle=function(id) {
  if (xbox.is_expanded(id)) {
    xbox.collapse(id);
  } else {
    xbox.expand(id);
  }
  return false;
}
xbox.init=function(id) {
  xbox.get_button(id).style.display = 'block';
  if(xbox.is_expanded(id)){
    xbox.expand(id);
  }else{
    xbox.collapse(id);
  }
}

function SetCookie(sName, sValue, ttl) {
  var expires = "";
  if(!ttl){
    expires = "expires=Fri, 31 Dec 2099 23:59:59 GMT;";
  }else if(ttl>0){
    var date = new Date();
    var time = date.getTime();
    date.setTime(time+ttl);
    expires = "expires=" + date.toGTMString() + ";";
  }
  var domain = "domain=" + nk_options.cookies.domain;
  document.cookie = escape(sName) + "=" + escape(sValue) + "; path=/; " + expires + domain;
};

SetCookie('js_enabled',1,-1);


function GetCookie(sName) {
  sName=escape(sName);
  var aCookie = document.cookie.split("; ");
  for (var i=0; i < aCookie.length; i++)
  {
    var aCrumb = aCookie[i].split("=");
    if (sName == aCrumb[0]) 
      return unescape(aCrumb[1]);
  }
  return null;
};

Array.removeElementAt = function (a,index){
  a[index]=a[a.length-1];
  a.pop();
};

function dopasuj_do_liczebnika(n,komentarz,komentarze,komentarzy){
  switch(n){
    case 0:return komentarzy;
    case 1:return komentarz;
    case 2:case 3:case 4:return komentarze;
    default:
      if(n<22)
        return komentarzy;
      n%=10;
      if(n==2||n==3||n==4)return komentarze;
      return komentarzy;
  }
};





/**
 * Get other day
 * 
 * positive number - future days, negative - past
 * 
 * @param {Number} days
 */
Date.prototype.get_other_day = function(days) {
  if (days.constructor !== Number) {
    throw new Error('days must be number');
  }
  var date = new Date(this);
  date.setDate(date.getDate()+days);
  return date;
};

/**
 * Get yesterday date
 * @return {Date}
 */
Date.prototype.get_yesterday = function() {
  return this.get_other_day(-1);
};

/**
 * Is other day
 * @param {Number} days
 * @return {boolean}
 */
Date.prototype.is_other_day = function(days) {
  if (days.constructor !== Number) {
    throw new Error('days must be number');
  }
  var other_day = new Date().get_other_day(days);
  return this.toDateString() === other_day.toDateString();
};

/**
 * Is yesterday
 * @return {boolean}
 */
Date.prototype.is_yesterday = function() {
  var yesterday = new Date().get_yesterday();
  return this.toDateString() === yesterday.toDateString();
};

/**
 * new Date().is_today
 * 
 * @return {boolean} is date today 
 */
Date.prototype.is_today = function() {
  return this.toDateString() === new Date().toDateString();
};

/**
 * Date.is_today
 * @param {Date} date
 * @return {boolean} is date today
 */
Date.is_today = function(date) {
  return date.toDateString() === new Date().toDateString();
};

/**
 * Get hour minutes (hh:mm)
 * 
 * @return {String}
 */
Date.prototype.get_hour_minutes = function() {
  return this.toTimeString().substr(0,5);
}

/**
 * Get polish date string
 * @param {Date} date
 * @return {String} polish date
 */
Date.prototype.get_polish = function() {
  if (this.is_today()) { 
    return this.get_hour_minutes();
  }
  else if (this.is_yesterday()) { 
    return 'wczoraj ' + this.get_hour_minutes(); 
  }
  else {
    var month = this.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();
    var day = this.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();
    
    var date_string = month + '.' + day;
    return date_string + ' ' + this.get_hour_minutes();
  }
};

String.prototype.wbr_entities = function(num) {
  
  var wbr_str = this.replace(RegExp("(\\S{" + num + "})(\\S)", "g"), function(all){
    return all + "~wbr~";
  });
  wbr_str = wbr_str.replace(/\n/g, '~~nl~~\n');
  var ent_str = htmlentities(wbr_str);
  ent_str = ent_str.replace(/~~nl~~/g, '<br>\n');
  return ent_str.replace(/~wbr~/g, '<wbr>');
};

var $log = function(msg) {
  try {
    console.log(msg)
  }
  catch (e) {
    //console not found
  } 
}

var timetest = {
  start_time: 0,
  
  start: function() {
    this.start_time = new Date().getTime();
  },
  
  stop: function(msg) {
    msg = msg || 'time:';
    $log(msg + ' ' + (new Date().getTime()- this.start_time));
  },
  
  'function': function(func, count) {
    if (!func) $log('function must be set');
    this.start();
    if (count && count > 1) {
      for (var i=0; i<count; i++) {
        func();
      }
    }
    else {
      func();
    }
    this.stop();
  }
}

function report_js_error(e, label) {
  try {
    var window_location = {};
    $extend(window_location, window.location);
    var report = {
      'label' : label || '',
      'error' : e,
      'location' : window_location,
      'user_agent' : navigator.userAgent,
      'cookie' : document.cookie
    };
    var request = new Request.NK({
      'url' : '/js_errors/report',
      'data' : {
        'report' : JSON.encode(report)
      },
      'method' : 'post'
    });
    if(nk_options.js_errors.is_enabled && !nk_options.js_errors.is_anonymous) {
      var sample = nk_options.js_errors.labels[label] || 1;
      if(sample && $random(1,sample) == sample) {
        request.send();
      }
    }
    $log(e);
  } catch(e) {
    //na wypadek gdyby raport z failowal niechcemy zeby doszlo do zapetlen
  }
}

Request.NK = new Class({
  Extends : Request.JSON,
  options :  {
    'secure' : false
  },
  initialize : function(options) {
    this.parent(options);
    this.setHeader('isAjaxy','very');
    this.setHeader('Local-Timestamp', Math.round(new Date().getTime()/1000));
    this.setOptions({
      'data' : {
        't' : Cookie.read(nk_options.auth.basic_auth_cookie_name)
      }
    });
  },
  success: function(text) {
    try {
      this.response.json = JSON.decode(text, this.options.secure);
    } catch (e) {
      this.onFailure();
      return;
    }
    this.onSuccess(this.response.json, text);
  }
});

Request.FORM = new Class({
  Extends: Request.NK,
  
  initialize: function(options)
  {
    this.parent(options);
    this.setOptions({
      method: 'post',
      data: {
        __utm_admin: 'ΝO',
        auto_form_ticket: this.options.ticket
      }
    });
  }
});

Function.implement({
  bindWithStopEvent: function(bind, args) {
    var self = this;
    
    return function(e) {      
      if(e) {
        e.stop();
      }
      var function_args = [e].extend($splat(args));
      
      var returns = function(){
        return self.apply(bind || null, function_args);
      };
      
      return returns();
    };
  }
});

if(Cookie.read('js_debug_mode') != 1) {
  window.onerror = function(message,url,line) {
    var e = {
      'message' : message,
      'fileName' : url,
      'lineNumber' : line
    };
    report_js_error(e, 'uncaught_exception');
    return true;
  }
}

window.location_changer = {
  location: null,
  get: function() {
    return this.location;
  },
  add: function(new_location) {
    this.location = new_location;
  },
  clear: function() {
    this.location = null;
  }
};
