$(window).addEvent("domready_nk", function() {
  //przycisk uruchom nktalk pomimo whitelisty
  var button = $('run_nktalk_button');
  if(button) {
    button.addEvent('click', function() {
      Cookie.write('nktalk_force_load', 1,{'path' : '/'});
      window.location.reload();
    });
  }
});


function nktalk_redirects() {
  var nk_host = window.location.protocol + '//' + window.location.host + '/';

  if (window.location.href.test(/flood_guard_captcha_verification|first_login_after_rules_changes/)) {
    return;
  }

  if (!nk_options || window.location.protocol != 'http:') {
    return;
  }
  if (window.location.protocol == 'http:' && nk_options && !nk_options.nktalk.is_browser_supported && window.location.pathname === '/' && window.location.hash) {
    window.location.href =  nk_host + window.location.hash.substr(1);
    return;
  }
  if (window.location.protocol == 'http:' && nk_options && nk_options.nktalk && nk_options.nktalk.enabled) { 
    if (top == window && window.location.pathname && nk_options.nktalk.is_browser_supported) {
      window.location.href = '/#' + window.location.pathname.substr(1) + window.location.search + window.location.hash;
      return;
    }
  } else {
    if (window.location.pathname === '/' && window.location.hash) {
      window.location.href =  nk_host + window.location.hash.substr(1);
      return;
    }
  }

  if (top && top.nktalk_portal_manager) {
    top.nktalk_portal_manager.bodyready(window);
    window.addEvent("domready_nk", function(){
      top.nktalk_portal_manager.domready();
    });
  
   window.addEvent('load', function() {
      top.nktalk_portal_manager.portalready();
   });
  }
}

nktalk_redirects();
