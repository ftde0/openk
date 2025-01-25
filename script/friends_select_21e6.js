var FriendsSelect = new Class({

  Extends : FriendsList,

  initialize: function(config){
    var _this = this;
    this.config = config;

    this.dropdown= $(config.div_listbox_id);
    this.div_js = $(config.div_js_id);
    this.div_non_js = $(config.div_non_js_id);
    this.flags = config.flags;

    if(config.with_me){
      this.flags |= FRIENDS_LIST_FIELD_FLAGS.WITH_ME;
    }
    this.filter_field = this.get_filter_field();
    this.hidden_field = this.get_hidden_field();
    this.dropdown_shown = false;
    
    this.set_body_click_event();
    //we need an event that is both: repeated when user holds down the key, and is triggered by arrows
    //opera does not repeat keydown
    //ie does not triggger keypress for arrows (which is correct)
    //FX3 under Ubuntu, also does not repeat keydown
    this.repeated_arrows_event=Browser.Engine.presto||Browser.Engine.gecko&&Browser.Platform.linux?'keypress':'keydown';

    this.filter_field.addEvent(this.repeated_arrows_event,function(e){
      _this.filter_onkeydown(e);
    });
    this.filter_field.addEvent('keyup',function(e){
      _this.filter_onkeyup(e);
    });
    this.filter_field.addEvent('click',function(e){
      _this.clear_filter_and_show_dropdown(e);
    });
    this.parent(
        _this.flags,
        _this.filter_field,
        config.div_listbox_id,
        config.my_id,
        config.my_version,
        config.my_id,
        config.my_version,
        1,
        config.rows_count || 5,
        config.row_height || 41,
        _this.friend_renderer,
        _this.on_ready_to_show,
        _this.make_display_name,
        _this.this_make_sortword,
        _this.this_on_select,
        null// on_deselection
        );

    this.auto_highlight_mouse = true;
    this.auto_highlight_keyboard = true;
    this.auto_select_mouse = true;
    this.auto_select_keyboard = true;
    this.allow_multi_select = false;
    window.addEvent('load',function(event){
      _this.download();
    });
    this.set_default_message();
  },
  set_default_message : function() {
    this.filter_field.value = 'Kliknij, by zacząć wyszukiwać znajomych';
  },
  get_filter_field : function() {
    return this.div_js.getElement('input[name=' + this.config.filter_field_name + ']');
  },
  get_hidden_field : function() {
    return this.div_js.getElement('input[name=' + this.config.hidden_field_name + ']');
  },
  hide_dropdown : function(e) {
    $(this.dropdown).setStyle('display','none');
    this.dropdown_shown=false;
  },

  show_dropdown : function() {
    if (0 < this.list_displayed.length) {
      if (!this.dropdown_shown) {
        this.highlightPos(0);
        this.clearSelection();
        $(this.dropdown).setStyle('display','block');
        this.dropdown_shown=true;
        //Chrome, Safari and Opera reset the scrollbar when we hide
        if(Browser.Engine.presto || Browser.Engine.webkit){
          this.scrollRowIntoView(this.first_visible_row+this.max_rows-1);
        }
      }
    } else {      
      this.hide_dropdown(true);
    }
    return true;
  },

  clear_filter_and_show_dropdown : function(e) {
    e = e || event;
    this.filter_field.value = '';
    this.filter_list(false);
    this.show_dropdown();
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    e.cancelBubble = true;
    return false;
  },

  filter_onkeydown : function(e) {
    var keyCode = e.code;
    switch (keyCode) {
    case 38:// up arrow
    case 40:// down arrow
      this.show_dropdown();
    case 13:// enter
    case 3:// return
      this.dropdown.onkeydown(e);
      e.stop();
    }
  },

  filter_onkeyup : function(e) {
    var keyCode = e.code;
    switch (keyCode) {
    case 38:// up arrow
    case 40:// down arrow
    case 13:// enter
    case 3:// return
      e.stop();
      return;
    }
    this.show_dropdown();
  },

  make_display_name : function(e) {
    return e.user_info.FIRST_NAME + ' ' + e.user_info.LAST_NAME;
  },
  
  highlight_filter : function(e, name) {
    var escaped_name = htmlentities(name);
    if (e.current_filter != null && e.current_filter != '') {
      var current_filter = RegExp.escape(e.current_filter);
      var re = new RegExp('^(([^&]*&[^;]*;)*[^&]*)(' + current_filter + ')',
        'ig');
      displayed_name = escaped_name.replace(re, '$1<span class="blue_background">$3</span>');
    } else {
      displayed_name = escaped_name;
    }
    return displayed_name;
  },
  friend_renderer : function(e) {
    var u = e.user_info;
    var name = this.make_display_name(e);
    var displayed_name = this.highlight_filter(e, name);
    var displayed_city = (u.CITY != null) ? htmlentities(u.CITY) : '';
    var cl = e.highlighted ? ' active' : '';
    var t = '<div id="recipient_' + u.UID + '" class="recipient' + cl
        + '"><p class="strong">' + displayed_name
        + '</p><p class="friends_list_city">' + displayed_city + '</p></div>';

    return t;
  },

  select_by_uid : function(uid){

    if(uid==null){
      return;
    }
    for(var i=0;i<this.users_info.length;i++){
      if(this.users_info[i].UID==uid){
        this.selectElement(i);
        return;
      }
    }
  },

  on_ready_to_show : function() {
    this.hide_dropdown();
    this.make_sorted(1);
    this.select_by_uid(this.config.selected_uid);
    this.div_js.setStyle('display','block');
    this.div_non_js.setStyle('display','none');
  },

  this_make_sortword : function(e, order) {
    if (order == 1) {
      return e.user_info.LAST_NAME.toLowerCase() + ' '
          + e.user_info.FIRST_NAME.toLowerCase();
    }
  },
  
  this_on_select : function(e) {
    var u=e.user_info;
    var name = this.make_display_name(e);
    this.hidden_field.value=u.UID;
    this.filter_field.value=name;
    this.hide_dropdown();
  }, 

  clearSelection : function() {
    this.parent();
    this.hidden_field.value=null;
  },

  set_body_click_event : function() {
    $(document.body).addEvent('click', function() {
      if(!this.hidden_field.value || this.hidden_field.value == "null") {
        this.set_default_message(); 
      }
      this.hide_dropdown();
    }.bind(this));
  }
});
