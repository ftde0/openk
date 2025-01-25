var InterfaceAuthor = new Class({
  Extends : InterfaceAbstract,
  flag : 0,
  initPinButton : function() {
    var that = this;
    this.module.add_pin_link.addEvent('click', function(e) {
      if(that.module.drag_mode) {
        return;
      }
      that.newPinDragger.bind(that)(e, that.addNewPinHandler.bind(that));
    });
  },
  extendPin : function(pin) {
    var that = this;
    if(pin.data.flags.toInt() === 0 ) {
      pin.mark.addEvent('click', function(e) {
        e.stopPropagation();
        if(pin.just_dragged) {
          pin.just_dragged = false;
          return;
        }
        that.editPinHandler.bind(that)(pin);
      });
      pin.box.addEvent('click', function(e) {
        e.stopPropagation();
        if(pin.just_dragged) {
          pin.just_dragged = false;
          return;
        }
        that.editPinHandler.bind(that)(pin);
      });
      that.pinDragger(pin);
    } else if(pin.data.flags.toInt() === 1 ) {
      var info_remove_button = new Element('a', {
        'class' : 'info_remove_button',
        'href' : '#del',
        'html' : 'Odepnij pinezkę tej osoby'
      });
      info_remove_button.addEvent('click', function() {
        that.blockUser.bind(that)(pin.data.id);
      });
      var pin_info_box = pin.box.getElement('div.pin_info_box');
      pin_info_box.grab(new Element('hr', {'class' : 'spacer'}));
      pin_info_box.grab(info_remove_button);
    }
  },
  extendFriend : function(friend) {
    var that = this;
    if (friend.flags == 1) {
      //users_box
      var block_button = that.createBlockButton();
      block_button.addEvent('click', function(){
        that.blockUser.bind(that)(friend.pin_id);
      });
      friend.element.grab(block_button, 'top');
    }
  },
  initialize : function(module) {
    
    this.parent(module);
    
    //extend
    var block_button = this.createBlockButton();
    //fl
    var field_name = 'pin_fl_field';
    var hidden_name = 'pin_fl_hidden';
    var pin_fl_container = new Element('div', {
      'id':'pin_fl_div',
      'styles' : {
        'display' : 'none'
      }
    });
    var pin_fl_field = new Element('input', {
      'name' : field_name,
      'id' : 'pin_fl_search',
      'type' : 'text',
      'autocomplete' : 'off',
      'oninput' : 'this.onpropertychange()',
      'class' : 'pin_fl_field'
    });
    var pin_fl_hidden = new Element('input', {
      'name' : hidden_name,
      'type' : 'hidden',
      'class' : 'pin_fl_hidden'
    });
    var pin_fl_dropdown = new Element('div', {
      'id' : 'pin_fl_dropdown'
    });
    pin_fl_container.grab(pin_fl_field);
    pin_fl_container.grab(pin_fl_hidden);
    pin_fl_container.grab(pin_fl_dropdown);
    this.module.pin_container.grab(pin_fl_container);
    var config = {
      'div_listbox_id'    : 'pin_fl_dropdown',
      'flags'             : this.module.config.flags,
      'div_js_id'         : 'pin_fl_div',
      'div_non_js'        : '',
      'with_me'           : 1,
      'filter_field_name' : field_name ,
      'hidden_field_name' : hidden_name,
      'selected_uid'      : null,
      'my_id'             : this.module.uid,
      'my_version'        : this.module.config.my_version
    };
    var fl = new PinFriendsSelect(config);
    fl.download();
    this.friends_list = fl;
  },
  getEditForm : function(data) {
    var edit_form = this.parent(data);
    var option = edit_form.getElement('div.options');
    var label = new Element('label', {
      'html' : 'Oznacz osobę na tym zdjęciu',
      'for' : 'pin_fl_checkbox'
    });
    option.grab(label, 'top');
    var checkbox = new Element('input', {
      'id' : 'pin_fl_checkbox',
      'type' : 'checkbox'
    });
    option.grab(checkbox, 'top');
    if(data.friend_id && data.friend_id != 0) {
      checkbox.set('disabled' , 1);
      checkbox.checked = true;
    }
    var hidden = new Element('input', {
      'type' : 'hidden',
      'id'   : 'pin_flags',
      'value': 0
    });
    edit_form.grab(hidden);
    var wrapper = edit_form.getElement('div.pf_wrapper');
    wrapper.grab(this.friends_list.div_js);
    if(this.friends_list.ready !== true) {
      if (!(data.friend_id && data.friend_id != 0)) {
        option.setStyle('visibility', 'hidden');
      }
      return edit_form;
    }
    this.friends_list.resetData();
    var that = this;
    checkbox.addEvent('click', function(e) {
      edit_form.getElement('button.pf_submit').toggleClass('low');
      that.friends_list.clear_filter_and_show_dropdown(e);
      if (that.friends_list.div_js.getStyle('display') == 'none') {
        that.friends_list.div_js.setStyle('display', 'block');
      } else {
        that.friends_list.div_js.setStyle('display', 'none');
        that.friends_list.resetData();
      }
    });
    return edit_form;
  },
  addNewPinHandler : function(coords) {
    if(this.module.edit_mode) {
      return;
    }
    var that = this;
    this.module.turnEditMode();
    var data = new PinModel();
    data.pos_x = coords.left - this.module.pin_container.getLeft();
    data.pos_y = coords.top - this.module.pin_container.getTop() ;
    var edit_form = this.getEditForm(data);
    edit_form.getElement('div.pf_cancel').addEvent('click', function() {
      $('new_pin').dispose();
    });
    edit_form.getElement('a.remove_button').addEvent('click', function(e) {
      e.preventDefault();
      edit_form.dispose();
      $('new_pin').dispose();
      that.module.turnViewMode();
    });
    edit_form.getElement('button.pf_submit').addEvent('click', function(e){
      e.preventDefault();
      var data = new PinModel();
      var relative_coords = that.module.getRelative.bind(that.module)(coords.left,coords.top);
      data.pos_x = relative_coords.left;
      data.pos_y = relative_coords.top;
      data.friend_id = edit_form.getElement('input.pin_fl_hidden').get('value');
      data.friend_name = edit_form.getElement('input.pin_fl_field').get('value');
      data.description = edit_form.getElement('textarea.pf_description').get('value');
      data.flags = 0;
      if(!data.description && data.friend_id == 0) {
        that.module.handleError(-5);
        return;
      }
      that.module.pin_manager.savePin(data, that.addPinInUI.bind(that));
      edit_form.dispose();
      $('new_pin').dispose();
      that.module.turnViewMode();
    });
    this.module.pin_container.grab(edit_form);
    edit_form.getElement('textarea.pf_description').focus();
  },
  editPinHandler : function(pin) {
    if(this.module.edit_mode) {
      return;
    }
    var that = this;
    this.module.turnEditMode();
    this.module.hideBoxes();
    var edit_form = this.getEditForm(pin.data);
    edit_form.getElement('a.remove_button').addEvent('click', function(e) {
      e.preventDefault();
      that.removePinHandler(pin.data.id);
      edit_form.dispose();
      that.module.turnViewMode();
    });
    edit_form.getElement('button.pf_submit').addEvent('click', function(e){
      e.preventDefault();
      var data = new PinModel();
      data.id = pin.data.id;
      data.pos_x = pin.data.pos_x;
      data.pos_y = pin.data.pos_y;
      data.friend_id = edit_form.getElement('input.pin_fl_hidden').get('value');
      data.friend_name = edit_form.getElement('input.pin_fl_field').get('value');
      data.description = edit_form.getElement('textarea.pf_description').get('value');
      data.flags = pin.data.flags;
      that.module.pin_manager.savePin(data, that.updatePinInUI.bind(that));
      edit_form.dispose();
      that.module.turnViewMode();
    });
    this.module.pin_container.grab(edit_form);
    edit_form.getElement('textarea.pf_description').focus();
    return false;
  }
});
