function make_display_name(e){
  return e.album_info.TITLE;
}
function make_sortword(e,order){
  if(order==1){
    return e.album_info.TITLE.toLowerCase();
  } else if( order==2) {
    if( e.ratings_info != null ) {
      if( e.ratings_info.RATED_COUNT == 0 ) {
        return 0;
      } else {
        return -(e.ratings_info.RATED_SUM/(e.ratings_info.RATED_COUNT));
      }
    } else {
      return 0;
    }
  }
}
function cell_renderer(e){
  var displayed_name = e.album_info.TITLE;
  if(e.current_filter != null && e.current_filter!=""){
    e.current_filter=RegExp.escape(e.current_filter);
    var re= new RegExp('^([^<>]*(<[^>]*>[^<>]*)*)(' + e.current_filter + ')' , "ig");
    displayed_name=displayed_name.replace(re,'$1<span>$3</span>');
  }
  var echo = '<div class="album">';
  if ( ALBUMS_CONFIG.can_edit || ALBUMS_CONFIG.can_remove ) {
    echo += '<div class="album_tools album_tools_narrow';
    if( !albums_mode ) echo += ' hide';
    echo += '">';
    if( ALBUMS_CONFIG.can_edit && e.album_info.ALBUM_ID != 1) {
      echo += '<a id="photo_edit" href="/profile/';
      echo += e.his_id;
      echo += '/gallery/album/';
      echo += e.album_info.ALBUM_ID;
      echo += '/edit">&nbsp;</a>';
    }
    if( ALBUMS_CONFIG.can_remove && (e.album_info.ALBUM_ID != 1 && (ALBUMS_CONFIG.default_removeable || e.album_info.ALBUM_ID != 2) && (ALBUMS_CONFIG.non_empty_removeable || e.album_info.PHOTOS_COUNT == 0))) {
      echo += '<a id="photo_delete" href="/profile/';
      echo += e.his_id;
      echo += '/gallery/album/';
      echo += e.album_info.ALBUM_ID;
      echo += '/remove" onclick="return album_remove(' + e.his_id + ' ,' + e.album_info.ALBUM_ID + ', \'' + ALBUMS_CONFIG.remove_ticket + '\');">&nbsp;</a>';
    }
    echo += '</div>';
  }
  echo += '<div class="album_hlp">';
  if ( Number(new Date()) - (e.album_info.LAST_PHOTO * 1000) < 259200000 ) {
    echo += '<div class="album_new"><!-- . --></div>';
  }
  echo += '<table class="album_main_thumb"><tr><td>';
  echo += '<a class="album_photo" href="/profile/';
  echo += e.his_id;
  echo += '/gallery/album/';
  echo += e.album_info.ALBUM_ID;
  echo += '">';
  echo+='<img class="thumb" alt="miniaturka albumu" src="' + e.album_info.MAIN_PHOTO + '">';
  echo += '</a>';
  echo += '</td></tr></table>';
  if( ALBUMS_CONFIG.ratings_can_view && e.ratings_info != null ) {
    echo += '<a class="album_rating" href="/profile/';
    echo += e.his_id;
    echo += '/gallery/album/';
    echo += e.album_info.ALBUM_ID;
    echo += '"><span>opinia<strong>';
    if( e.ratings_info.RATED_COUNT == 0 ) {
      echo += '-';
    } else {
      var avg = (e.ratings_info.RATED_SUM/(e.ratings_info.RATED_COUNT));
      if ( avg > 500 ){
        echo += '5+';
      } else {
        avg = avg/100;
        echo += avg.toFixed(2);
      }
    }
    echo += '</strong></span></a>';
  }
  echo += '</div>';
  echo += '<p class="album_name"><a href="/profile/' + e.his_id + '/gallery/album/' + e.album_info.ALBUM_ID + '">' + displayed_name.wbr_entities(15) + '</a></p>';
  echo += '<div class="album_info"><span class="album_date">' + e.album_info.ALBUM_DATE + '</span><span class="album_separator"> | </span><a href="/profile/' + e.his_id +'/gallery/album/' + e.album_info.ALBUM_ID + '" class="album_count"> liczba zdjęć: ';
  echo += '<span>' + e.album_info.PHOTOS_COUNT + '</span></a></div>';
  echo += '</div>';
  return echo;
}
function swap_to_js(){
  var albums_with_js = $('albums_with_js');
  if( AlbumsListWindow.all_elements_count == 0 ) {
    albums_with_js.set('html', '<p>' + ALBUMS_CONFIG.empty_text + '</p>');
    albums_with_js.style.display='block';
    var old=byId('albums_list_wo_js');
    if(old){
      old.style.display='none';
    }
    return;
  }
  AlbumsListWindow.make_sorted(0);
  $('sort_select1').addEvent('change', function(){
    AlbumsListWindow.make_sorted(parseInt(this.value));
    this.value = 0;
  });
  $('sort_select2').addEvent('change', function(){
    AlbumsListWindow.make_sorted(parseInt(this.value));
    this.value = 0;
  });
  albums_with_js.style.display='block';
  var old=byId('albums_list_wo_js');
  if(old){
    old.style.display='none';
  }
}

var AlbumsListWindow= new AlbumsList(
  ALBUMS_LIST_FIELD_FLAGS.ALBUM_ID|ALBUMS_LIST_FIELD_FLAGS.TITLE|ALBUMS_LIST_FIELD_FLAGS.MAIN_PHOTO|ALBUMS_LIST_FIELD_FLAGS.PHOTOS_COUNT|ALBUMS_LIST_FIELD_FLAGS.ALBUM_DATE|ALBUMS_LIST_FIELD_FLAGS.LAST_PHOTO,
  'albums_list_window',
  new Array('js_paginator1', 'js_paginator2'),
  ALBUMS_CONFIG.my_uid,
  ALBUMS_CONFIG.my_version,
  ALBUMS_CONFIG.his_uid,
  3,
  3,
  cell_renderer,
  swap_to_js,
  make_sortword
);
AlbumsListWindow.download();
