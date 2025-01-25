var InterfaceAbstract = new Class({
  flag : null,
  text_limit : 100,
  initialize : function(module) {
    this.module = module;
  },
  extendPin : function(pin) {
    //abstract
  },
  initPinButton : function() {
  },
  extendFriend : function() {
    //abstract
  },
  postInterface : function() {
    
  },
  createBlockButton : function() {
    var block_button = new Element('span', {
      'class': 'block_button',
      'html': '<img src="' + this.module.config.remove_me_src + '" alt="Usuń pinezke">' 
    }); 
    return block_button;    
  },
  getEditForm : function(data) {
    var that = this;
    var pos_x = data.pos_x.toInt() - 347;
    var pos_y = data.pos_y.toInt() + 17;
    var pin_form = new Element('form', {
      'class' : 'pin_edit_form',
      'styles' : {
        'position' : 'absolute',
        'z-index' : '9999',
        'left' : pos_x,
        'top' : pos_y
      }
    });
    var navy_box_top = new Element('div', {
      'class' : 'navy_box_top'
    });
    var pf_header = new Element('h4', {
      'html' : 'Dodaj opis pinezki' 
    });
    navy_box_top.grab(pf_header);
    var pf_cancel = new Element('div', {
      'class' : 'pf_cancel'
    });
    pf_cancel.addEvent('click', function(){
      pin_form.dispose();
      that.module.turnViewMode();
    });
    navy_box_top.grab(pf_cancel);
    pin_form.grab(navy_box_top);
    var navy_box_content = new Element('div', {
      'class' : 'navy_box_content'
    });
    var pf_info = new Element('p', {
      'class' : 'pf_info'
    });
    pf_info_label = new Element('span', {
      'class' : 'pf_info_label',
      'html' : '<strong>Treść</strong> (maksymalnie ' + that.text_limit + ' znaków)'
    });
    var pf_remove_button = new Element('a', {
      'href' : '#',
      'class' : 'remove_button',
      'html' : 'Usuń tę pinezkę'
    });
    pf_info.grab(pf_info_label);
    pf_info.grab(pf_remove_button);
    var pf_description = new Element('textarea', {
      'class' : 'pf_description',
      'value' : data.description
    });
    pf_description.onpropertychange =  function() {
      var text = this.get('value');
      if(text.length > that.text_limit) {
        this.set('value',text.substr(0,that.text_limit)) ;
      }
    };
    try {
      pf_description.addEventListener('input', pf_description.onpropertychange, 0);
    } catch(e) {
      
    }
    var pf_wrapper = new Element('div', {
      'class' : 'pf_wrapper'
    });
    var pf_options = new Element('div', {
      'class' : 'options'
    });
    var pf_submit = misc_create_button('Zapisz');
    $(pf_submit).addClass('pf_submit');
    pf_wrapper.grab(pf_submit);
    pf_wrapper.grab(pf_options);
    navy_box_content.grab(pf_info);
    navy_box_content.grab(pf_description);
    navy_box_content.grab(pf_wrapper);
    pin_form.grab(navy_box_content);
    var navy_box_bottom = new Element('div', {
      'class' : 'navy_box_bottom'
    });
    pin_form.grab(navy_box_bottom);
    return pin_form;
  },
  pinDragger : function(item) {
    var that = this;
    item.drag = new Drag(item.mark, {
      snap: 0,
      limit : {
        'x' : [0, this.module.pin_container.getWidth() - item.mark.getWidth() ],
        'y' : [0, this.module.pin_container.getHeight() - item.mark.getHeight()]
      },
      onComplete: function(){
        item.pos_changed = true;
        var new_pos_x = item.mark.getStyle('left').toInt();
        var new_pos_y = item.mark.getStyle('top').toInt();
        var tmp_pin = that.module.getPinByPos(new_pos_x, new_pos_y);
        if(tmp_pin == 0 || tmp_pin == item.data.id) {
          item.data.pos_x = new_pos_x;
          item.data.pos_y = new_pos_y;
        } else {
          that.module.handleError(-6);
        }
        item.updatePos();
        item.module.drag_mode = false;
        item.just_dragged = true;
      },
      onStart : function() {
        item.module.hideBoxes();
        item.module.showMarks();
        item.module.drag_mode = true;
      }
    });
  },
  newPinDragger : function(e, callback) {
    if(this.module.drag_mode || this.module.edit_mode) {
      return;
    }
    var count = this.module.pins ? this.module.pins.getLength() : 0;
    var pin_mark = new Element('div', {
      'class' : 'pin_mark_' + this.module.flagToClass(this.flag),
      'id' : 'new_pin',
      'styles' : {
        'display' : 'block',
        'z-index' : 99999
      }
    });
    this.module.pin_container.grab(pin_mark);
    var pos_x = e.page.x - this.module.pin_container.getLeft() - 12;
    var pos_y = e.page.y -  this.module.pin_container.getTop() - 13;
    pin_mark.setStyles({
      'left' : pos_x ,
      'top'  : pos_y 
    });
    var that = this;
    var drag = new Drag(pin_mark,{
      snap : 0,
      onComplete : function() {
        that.module.drag_mode = false;
        this.detach();
        var coords = pin_mark.getCoordinates();
        var con_coords = that.module.pin_container.getCoordinates();
        if(coords.left < con_coords.left || coords.right > con_coords.right || coords.top < con_coords.top || coords.bottom > con_coords.bottom ) {
          pin_mark.dispose();
          return;  
        } 
        var rel_coords = that.module.getRelative(coords.left, coords.top);
        if(that.module.getPinByPos(rel_coords.left, rel_coords.top)) {
          pin_mark.dispose();
          that.module.handleError(-6);
          return;
        }
        callback(coords);
      },
      onStart : function() {
        that.module.hideBoxes();
        that.module.showMarks();
        that.module.drag_mode = true;
      }
    });
    drag.start(e);
  },
  blockUser : function(pin_id) {
    this.removePinHandler(pin_id, true);
  },
  removePinHandler : function(pin_id,block) { 
   if(!this.module.pins) { 
     return; 
   } 
   block = block || false;
   var pin = this.module.pins[pin_id]; 
   if (pin.data.friend_id && pin.data.friend_id != 0) { 
     var users_box =  pin.data.flags == 0 ? this.module.users_box : this.module.imp_users_box; 
     users_box.removeUser(pin.data.friend_id); 
     this.module.redrawContainer();
   } 
   this.module.pin_manager.removePin(pin.data,block); 
   pin.remove(); 
  },
  addPinInUI : function(data) {
    data.description = data.description.substr(0,this.text_limit);
    this.module.pins.set(data.id, new Pin(data, this.module));
    if(data.friend_id && data.friend_id != 0) {
     var params = {
       'pin_id' : data.id,
       'friend_id' : data.friend_id,
       'friend_name' : data.friend_name,
       'flags' : data.flags
     }
     var users_box =  data.flags == 0 ? this.module.users_box : this.module.imp_users_box; 
     users_box.addUser(params);
     this.module.redrawContainer();
    }
    this.module.hideBoxes();
    this.module.showMarks();
  },
  updatePinInUI : function(data) {
    var pin = this.module.pins[data.id];
    pin.data.id = data.id;
    pin.data.pos_x = data.pos_x;
    pin.data.pos_y = data.pos_y;
    pin.data.description = data.description.substr(0,this.text_limit);
    if(data.friend_id != 0 ) {
      pin.data.friend_id = data.friend_id;
      pin.data.friend_name = data.friend_name 
      var params = {
        'pin_id' : pin.data.id,
        'friend_id' : pin.data.friend_id,
        'friend_name' : pin.data.friend_name,
        'flags' : pin.data.flags
      }
      var users_box =  data.flags == 0 ? this.module.users_box : this.module.imp_users_box; 
      users_box.addUser(params);
      this.module.redrawContainer();
    }
    pin.redrawElement();
    this.module.hideBoxes();
    this.module.showMarks();
  }
});
