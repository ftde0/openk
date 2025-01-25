var Rollover =  new Class({
  avatar : new RolloverAvatar(),

  show_delay : 500, // w ms
  hide_delay : 500, // w ms
  
  show_timer : null,
  hide_timer : null,

  defined_height : 158,
  defined_width : 305,

  element : null,
  parser : null, 
  
  initialize : function(container, parser) {
    this.container = container;
    this.parser = parser;
    var that = this;
    var element = new Element('div', {
      'styles' : {
        'display' : 'none'
      },
      'class' : 'roster_rollover',
      'events' : {
        'mousedown' : function(e) {
          e.stopPropagation();
        },
        'mouseover' : function() {
          that.clear_hide_timer();
          that.clear_show_timer();
        }
      }
    });
    this.element = element;
  },
  show : function(u,ref_element) {
    this.clear_show_timer();
    this.element.empty();
    this.element.grab(this.avatar.render(u));
    var rollover_status_text = $('rollover_status_text');
    if(null != this.parser) {
      this.parser.run([rollover_status_text]);
    }
    try {// IE hack
      if(!ref_element) {
        throw true;
      }
      ref_element.getCoordinates();
    } catch(e) {
      return;
    }
    this.set_rollover_pos(ref_element);
    this.element.setStyle('display','block');
  },
  set_rollover_pos : function(ref_element) {
    ref_element.getParent().grab(this.element);
  },
  hide : function() {
    this.clear_show_timer();
    this.element.setStyle('display', 'none');
  },
  clear_hide_timer : function() {
    $clear(this.hide_timer);
  },
  clear_show_timer : function() {
    $clear(this.show_timer);
  },
  schedule_show : function(u,coords,item) {
    this.clear_show_timer();
    this.clear_hide_timer();
    this.show_timer = this.show.delay(this.show_delay, this, [u,coords,item]); 
  },
  schedule_hide : function() {
    this.clear_show_timer();
    this.clear_hide_timer();
    this.hide_timer = this.hide.delay(this.hide_delay, this);
  }
});

