function findPosY(obj) {
  var curtop = 0;
  if(obj.offsetParent)
      while(1)
      {
        curtop += obj.offsetTop;
        if(!obj.offsetParent)
          break;
        obj = obj.offsetParent;
      }
  else if(obj.y)
      curtop += obj.y;
  return curtop;
}

  var checker_intval = '';
  
  var check_win_height = function() {
    var win_height = document.documentElement.clientHeight;
    var first_box = document.getElementById('last_photos_box_ajax');
    if (win_height > findPosY(first_box)) {
      window.clearInterval(checker_intval);
      show_all_boxes();
      window.onscroll = null;
      return true;
    }
    else {
      return false;
    }
  }


var last_photos_old_on_load = window.onload ? window.onload : function() {};
var last_photos_on_load = function () {
  if (check_win_height() === false) {
    checker_intval = setInterval(check_win_height, 1000);
  }
}

window.onload = function() {
  last_photos_old_on_load();
  last_photos_on_load();
};

var show_box = function(url, container_id) {
  var container = document.getElementById(container_id);
  if (!container) {
    return false;
  }
  
  if (container.innerHTML != '') {
    return true;
  }
  
  var ajax = new sack();
  ajax.method = 'get';
  ajax.requestFile = url;
  
  var show_wait_msg = function() {
    var loading_box = document.getElementById('last_photos_box_loading');
    if (typeof(loading_box) != 'undefined') {
      loading_box.style.display = 'block';
    }
  }
  
  ajax.onLoading = show_wait_msg;
  ajax.onInteractive = show_wait_msg;
  
  ajax.onCompletion = function() {
    if (this.responseStatus[0] != 200) {
      return false;
    }
    var loading_box = document.getElementById('last_photos_box_loading');
    if (typeof(loading_box) != 'undefined') {
      loading_box.style.display = 'none';
    }
    container = document.getElementById(container_id);
    if (typeof(container) != 'undefined') {
      container.innerHTML = this.response;
    }
    var ad_content = document.getElementById('LastPhotosBoxAdContent');
    if(ad_content != null){
      var last_photo_td = document.getElementById('last_photo_td');
      if (last_photo_td != null){
        last_photo_td.innerHTML = ad_content.innerHTML;  
      }  
    }
    if (typeof(g_gatrack) != 'undefined' && typeof(g_gatrack.init) != 'undefined') {
      g_gatrack.init();
    }
  }
  ajax.runAJAX();
  return true;
};

var show_all_boxes = function() {
  return show_box('/ajax_boxes/last_photos', 'last_photos_box_ajax'); 
}

window.onscroll = function() {
  if (show_all_boxes()) {
    window.onscroll = null;
  }
}
