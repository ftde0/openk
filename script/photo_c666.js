function show_edit_photo_description_form(link) {
  this.area = $('photo_description_area');
  if(this.area !== null ){
    this.area.value = photo_description;
    $('photo_description_edit').removeClass('hide');
    $('description_form').addClass('hide');
    photo_description_form(link);
    this.area.focus();
    return false;
  }
  return true;
}

function hide_edit_photo_description_form() {
  $('photo_description_edit').addClass('hide');
  $('description_form').removeClass('hide');
  desc = $('act_description');
  if (desc.innerHTML == '') {
    desc.innerHTML = 'Dodaj opis';
  }
  return false;
}

function show_add_comment_form() {
  $('add_comment').removeClass('hide');
  $('add_comment_pencil').addClass('hide');
  $('comment_txt').addClass('hide');
  $('add_comment_content').focus();
  return false;
}

function hide_add_comment_form() {
  $('add_comment').addClass('hide');
  $('comment_txt').removeClass('hide');
  $('add_comment_pencil').removeClass('hide');
  return false;
}

var photo_description_form = function(link) 
{
  new AjaxForm(
    'desc_form',
    {
      action: link + '/description',
      onSuccess: function(response) {
        $('act_description').set('html',response.RESPONSE.CONTENT);
        photo_description = response.RESPONSE.NEW_DESC;
        hide_edit_photo_description_form();
      }.bind(this),       
      onFailure: function() {
        new Popup({
          title: 'Błąd',
          content: PopupConfig.ajax_error,
          content_safe_mode: false,
          buttons: [{label: 'Ok'}]
        });
      }
    }
  );
}
