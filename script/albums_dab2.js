function toogle_edit_mode(buttons){
  if( albums_mode ) {
    albums_mode = false;
    SetCookie('edit_mode', 'normal');
    buttons.each(function(button){
      $(button).innerHTML = '<img alt="Tryb edycji" src="' + getStaticUri('/img/photos/btn_tryb_edycji') + '">';
    });
    var ico_edit_mode = $('bg_edit_mode');
    if(ico_edit_mode != null){
      ico_edit_mode.innerHTML = '<img src="' + getStaticUri('/img/photos/bg_tryb_edycji_off') + '" alt="Tryb edycji wyłączony" id="bg_edit_mode">';
    }
    $$('div.album_tools').addClass('hide');
  } else {
    albums_mode = true;
    SetCookie('edit_mode', 'edit');
    buttons.each(function(button){
      $(button).innerHTML = '<img alt="Wyłącz tryb edycji" src="' + getStaticUri('/img/photos/btn_tryb_edycji_off') + '">';
    });
    var ico_edit_mode = $('bg_edit_mode')
    if(ico_edit_mode != null){
      ico_edit_mode.innerHTML = '<img src="' + getStaticUri('/img/photos/bg_tryb_edycji') + '" alt="Tryb edycji włączony" id="bg_edit_mode">';
    }
    $$('div.album_tools').removeClass('hide');
  }
  return false; //!important
}

var refresh_input_length = function (input, output, limit){
  var text = input.value;
  var len = text.length;
  if( len > limit) {
    text = text.substring(0,limit);
    input.value = text;
    len = text.length;
  }
  output.set('text', len + '/' + limit);
}

var refresh_photos_count = function () {
  var choose_album = $('choose_album');
  var photos_count_div = $('photos_count');
  photos_count_div.set('html', 'zdjęć w albumie: <strong>' + albums_photos_count[choose_album.options[choose_album.selectedIndex].value] + '</strong>');
}

var album_privileges_friends_click = function() {
  var friends_checkbox = $('album_privileges_form_friends');
  if(friends_checkbox && !friends_checkbox.checked) {
    $('album_privileges_form_all').checked = false;
  }
}

var album_privileges_all_click = function() {
  var all_checkbox = $('album_privileges_form_all');
  if(all_checkbox && all_checkbox.checked) {
    $('album_privileges_form_friends').checked = true;
  }
}

var album_privileges_init = function() {
  var friends_checkbox = $('album_privileges_form_friends');
  var all_checkbox = $('album_privileges_form_all');
  if( all_checkbox && friends_checkbox ) {
    all_checkbox.addEvent('click', album_privileges_all_click);
    friends_checkbox.addEvent('click', album_privileges_friends_click);
  }
}

var albums_old_onload = window.onload ? window.onload : function() {};

var albums_new_onload = function () {
  album_privileges_init();
  var title = $('album_title');
  var do_func = function() {refresh_input_length(title, $('title_length'), nk_options.album.title_length_limit);}
  if( title != null ) {
    title.addEvent('keyup', do_func);
    do_func();
  }
  
  var localization = $('form1_localization');
  var do_func = function() {refresh_input_length(localization, $('localization_length'), nk_options.album.localization_length_limit);}
  if( localization != null ) {
    localization.addEvent('keyup', do_func);
    do_func();
    
  }

  var description = $('opis_albumu');
  var do_func = function() {refresh_input_length(description, $('description_length'), nk_options.album.description_length_limit);}
  if( description != null ) {
    description.addEvent('keyup', do_func);
    do_func();
  }
  
  var choose_album = $('choose_album');
  if( choose_album != null ) {
    choose_album.addEvent('change', refresh_photos_count);
    refresh_photos_count();
  }

}
  
window.onload = function() {
  albums_old_onload();
  albums_new_onload();
}

