var mail_invite_label = "adres e-mail";

var mail_invite_old_onload = window.onload ? window.onload : function() {};

function mail_invite_onload()
{
  var input = document.getElementById('mail_invite_email');
  if (!input) return;
  input.value = mail_invite_label;
  input.onfocus = function() {
    if (input.value == mail_invite_label) input.value = '';
    return true;
  }
  input.onblur = function() {
    if (input.value == '') input.value = mail_invite_label;
    return true;
  }
}

window.onload = function() {
  mail_invite_old_onload();
  mail_invite_onload();
}
