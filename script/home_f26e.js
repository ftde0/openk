var home_old_on_load = window.onload ? window.onload : function() {};
var home_on_load = function () {
  var login_input = $('login_login');
  var pass_input = $('login_pass');
  if (login_input && !document.is_focused && login_input.value == '') login_input.focus();
  else if( pass_input && !document.is_focused ) pass_input.focus();

  var delay_before_login = $('delay_before_login');
  if (delay_before_login) {
    var self_id;
    self_id = setInterval(
      function() {
        var ret = delay_before_login.get('html');
        if (ret > 0) {
          --ret;
          delay_before_login.set('html', ret);
          return;
        }
        clearInterval(self_id);
      },
      1000
    );
  }
}

window.addEvent('load', home_on_load);
