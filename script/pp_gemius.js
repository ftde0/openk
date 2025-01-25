// (c) 2000-2007 by Gemius SA


var gemius_host = 'adnet.hit.gemius.pl';
var gemius_proto;
if(document.location && document.location.protocol) {
  gemius_proto = 'http'+((document.location.protocol=='https:')?'s':'')+'://';
} else {
  gemius_proto = 'http://';
}
var gemius_full_host = gemius_proto+gemius_host+'/_'+(new Date()).getTime();

function gemius_parameters() {
  var d=document;
  var href=new String(d.location.href);
  var ref;
  if (d.referrer) { ref = new String(d.referrer); } else { ref = ""; }
  var t=typeof Error;
  if(t!='undefined') {
    eval("try { if (typeof(top.document.referrer)=='string') { ref = top.document.referrer } } catch(gemius_ex) { }")
  }
  var url='&tz='+(new Date()).getTimezoneOffset()+'&href='+escape(href.substring(0,299))+'&ref='+escape(ref.substring(0,299));
  if (screen) {
    var s=screen;
    if (s.width) url+='&screen='+s.width+'x'+s.height;
    if (s.colorDepth) url+='&col='+s.colorDepth;
  }
  return url;
}

function gemius_load_script() {
  if (window.pp_gemius_image.width && window.pp_gemius_image.width>1) {
    if (document.createElement) {
      var xp_body = document.body;
      var xp_javascript = document.createElement('script');
      var xp_url = window.pp_gemius_script;
      if(typeof Error !='undefined') {
        eval("try { xp_javascript.src = xp_url; xp_javascript.type = 'text/javascript'; xp_javascript.defer = true; } catch(exception) { }")
        if (xp_body && xp_body.appendChild) {
          xp_body.appendChild(xp_javascript);
        }
      }
    }
  }
}

if (typeof pp_gemius_identifier == 'undefined') {
  if (typeof gemius_identifier != 'undefined') {
    pp_gemius_identifier = gemius_identifier;
  } else {
    pp_gemius_identifier = '';
  }
}

if (typeof window.pp_gemius_image != 'undefined') {
  if (typeof window.pp_gemius_images == 'undefined') {
          window.pp_gemius_images = new Array();
  }
  var gemius_l = window.pp_gemius_images.length;
  window.pp_gemius_images[gemius_l]=new Image();
  window.pp_gemius_images[gemius_l].src = gemius_full_host+'/redot.gif?l=13&id=ERR_'+pp_gemius_identifier+gemius_parameters();
} else {
  if (typeof pp_gemius_mode == 'undefined') {
    if (window.attachEvent) { 
      window.attachEvent("onload", gemius_load_script);
    } else if(window.addEventListener) {
      window.addEventListener("load", gemius_load_script, false);
    }
    window.pp_gemius_image = new Image();
    window.pp_gemius_image.src = gemius_full_host+'/rexdot.gif?l=12&id='+pp_gemius_identifier+gemius_parameters();
    window.pp_gemius_script = gemius_full_host+'/pp.js?id='+pp_gemius_identifier;
  } else {
    window.pp_gemius_image = new Image();
    window.pp_gemius_image.src = gemius_full_host+'/redot.gif?l=14&id='+pp_gemius_identifier+gemius_parameters();
  }
}
gemius_identifier = 'USED_'+pp_gemius_identifier;
pp_gemius_identifier = 'USED_'+pp_gemius_identifier;

function pp_gemius_hit_int(list,rfrom,rto) {
  var gemius_url = gemius_proto+gemius_host+'/_'+(new Date()).getTime()+'/redot.gif?l=15'
  for (var i=rfrom ; i<rto ; i++) {
    gemius_url += '&id='+list[i];
  }
  gemius_url += gemius_parameters();
  if (typeof window.pp_gemius_ajax_images == 'undefined') {
          window.pp_gemius_ajax_images = new Array();
  }
  var gemius_l = window.pp_gemius_ajax_images.length;
  window.pp_gemius_ajax_images[gemius_l]=new Image();
  window.pp_gemius_ajax_images[gemius_l].src = gemius_url;
}

function pp_gemius_hit() {
  for (i=0 ; i<arguments.length ; i+=5) {
    if (i+5<arguments.length) {
      pp_gemius_hit_int(arguments,i,i+5);
    } else {
      pp_gemius_hit_int(arguments,i,arguments.length);
    }
  }
}
