/**
 * @author Milosz Kordecki
 */
var Avatar = new function(){

  var _this = this;
  
  this.max_friends_count = 99999;
  this.is_anonymous = nk_options.avatars.is_anonymous;
  this.t_ticket = nk_options.avatars.add_friend_ticket || null;
  this.uid = nk_options.avatars.self_uid || null;
  this.options_class_name = 'avatar_options';
  this.bar_class_name = 'avatar_bar';
  this.options_button_class_name = 'avatar_arrow';
  this.close_button_class_name = 'avatar_close_arrow';
  this.avatar_info_class_name = 'avatar_info';
  this.hover_timeout = 300;

  
  this.swap_to_js = function(){
    var avatars = $$('div.avatar');
    $each(avatars, function(item) {
      item.setStyle('display', 'block');
    });
    avatars = $$('div.avatar_no_js');
    $each(avatars, function(item) {
      item.setStyle('display', 'none');
    });
  }
  
  
  this.toggle_options = function(obj){
    _this.hide_all_options();
    $(obj).getNext().style.display = 'block';
  }
  this.set_bar_events = function(){
    var bar = $$('div.' + _this.bar_class_name);
    $each(bar, function(item) {
      item.addEvent('click', function(e){
        _this.stop_propagation(e);
      });
    }); 
  }
  this.stop_propagation = function(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.cancelBubble = true;
  }
  this.hide_all_options = function() {
    var options = $$('div.' + _this.options_class_name);
    $each(options,function(item) {
      item.style.display = 'none';
    });
  };
  
  this.set_body_event = function() {
    $(document).addEvent('click', function(event){
      _this.hide_all_options();
    });  
  };
  
  this.onload = function() {
    _this.catch_avatars($$('div.avatar_no_js'), $$('div.avatar'));    
    _this.set_body_event();
  };
  
  this.catch_avatars = function(no_js, js)
  {    
    $each(no_js, function(item) {
      item.setStyle('display', 'none');
    });    
    $each(js, function(avatar) {
      var options_list = avatar.getElement('ul.avatar_options_list');      
      if(options_list && options_list.getElements('li') < 2) {
        avatar.getElement('div.avatar_arrow').addClass('disabled');
      }
      avatar.setStyle('display', 'block');
      _this.set_avatar_events(avatar);
    });
  };
  
  this.set_avatar_events = function(avatar) {
    _this.set_hover(avatar);
    _this.set_close_button_event(avatar);
    _this.set_option_button_event(avatar);
    _this.set_bar_event(avatar);
  }
  this.add_hover = function(el) {
    if ($(el).has_hover) {
      return;
    }
    el.has_hover = true;
    el.t = setTimeout( function() {
      var _html = el.getElement('div.avatar_user_info');
      if(!_html) {
         return;
      }      
      var avatar_user_info_hover = new Element('div', {
        'class': 'avatar_user_info_hover',
        'html': _html.innerHTML
      });
      el.addEvent('mouseleave', function() {
        el.has_hover = false;
        $(avatar_user_info_hover).dispose();
      });
      el.grab(avatar_user_info_hover);
    } ,_this.hover_timeout);
  }
  this.set_hover = function(avatar) {
    var el = avatar.getElement('div.' + _this.avatar_info_class_name);
    if (el) {
      el.addEvent('mouseover', function(e){
        _this.add_hover(this);
      });
      el.addEvent('mouseleave', function(e){
        clearTimeout(this.t);
        this.has_hover = false;
      });
    }
  }
  this.set_close_button_event = function(avatar) {
    var el = avatar.getElement('span.' + _this.close_button_class_name);
    if (el) {
      el.addEvent('click', function(e){
        _this.hide_all_options();
      });
    }
  }
  this.set_option_button_event = function(avatar) {
    var el = avatar.getElement('div.' + _this.options_button_class_name);
    if (el && !el.hasClass('disabled')) {
      el.addEvent('click', function(e){
        _this.toggle_options(this);
      });
    }
  }
  this.set_bar_event = function(avatar){
    var el = avatar.getElement('div.' + _this.bar_class_name);
    if (el) {
      el.addEvent('click', function(e){
        _this.stop_propagation(e);
      });
    }
  }
}

$(window).addEvent('load', function(){
  Avatar.onload();
});

