var Popup = new Class({
  Implements: [Options, Events],
  
  options: {
    'title': '',
    'width': 300,
    'height': 'auto',
    'content': null,
    'content_safe_mode': true,
    'extra_class': '',
    'overlayer': true,
    'buttons': [],
    'position': null,
    'draggable': false, 
    'has_close_buttons' : true,
    'has_top' : true,
    'esc_exit': true
  },
  
  stack: new Array(),
  
  /**
   * Constructor
   * 
   * @param Object {options} - options
   */
  initialize: function(options) {
    this.setOptions(options);
    this.create();
        
    if(this.options.overlayer) {
      this.create_overlay().injectTop(document.body);
      this.center_overlay();
    }
    
    if(this.options.esc_exit && this.options.has_close_buttons) {
      $(document.body).addEvent('keypress', function(e) {
        if(e.key == 'esc') {
          this.close();
        }
      }.bind(this));
    }
    
    this.resize_handler = function() {
      if(this.options.overlayer) {
        this.center_overlay();
      }
      if(this.options.draggable) {
        this.center();
      }
    }.bind(this);
    
    $(window).addEvent('resize', this.resize_handler);
    this.box.injectTop(document.body);
    this.update(options);
    
    return this;
  },
  
  /**
   * Create popup
   */
  create: function() 
  {
    this.box = new Element('div', {'class': 'nk_popup_body ', 'events':{'click': function(e) { e.stopPropagation(); } }});
    if( this.options.has_top ) this.box.grab( this.box.top = new Element('div', { 'class': 'top' } ));
    this.box.grab( this.box.contener = new Element('div', { 'class': 'content', 'id': 'popup_content' } ));
    this.box.grab( this.box.bottom = new Element('div', { 'class': 'bottom' } ));
    
    if (this.options.has_top) {      
      this.box.top.grab(new Element('span', { 'class': 'right' } ));
      this.box.top.grab(new Element('span', { 'class': 'left' } ));
      this.box.top.grab(this.box.top.window_title = new Element('span', { 'class': 'title' } ) );
      if( this.options.has_close_buttons ) {
        this.box.top.close = new Element('span', { 'class': 'close', 'events': { 'click': this.close.bind(this) } });
        this.box.top.grab(this.box.top.close );
      }
    }
    
    this.box.bottom.grab(new Element('span', { 'class': 'right' } ));
    this.box.bottom.grab(new Element('span', { 'class': 'left' } )); 
  },
  
  /**
   * Create overlay
   */
  create_overlay: function() 
  {
    this.overlay = new Element('div', {
      'class': 'nk_popup_overlay',
      'styles' : {
        'opacity' : '0.7'
      }
    });
    
    if( this.options.has_close_buttons ) {
      this.overlay.addEvent('click', this.close.bindWithStopEvent(this));
      this.overlay.grab( new Element('p', {
        'text': 'kliknij na tło, by zamknąć okno',
        'class': 'nk_popup_overlay_hint'
      }));
    }
    
    return this.overlay;
  },
  
  /**
   * Update all elements in popup and center box
   * 
   * @params Object {options} - see constructor options
   */
  update: function(options) {
    this.setOptions(options);
    this.box.set('class','nk_popup_body ' + this.options.extra_class);
    if( this.options.has_top ) this.box.top.window_title.set('html',this.options.title);
    
    if(options && options.content) {
      this.box.contener.getChildren().dispose();
      if($type(this.options.content) == 'string') {
        this.box.contener.set(this.options.content_safe_mode ? 'text' : 'html',this.options.content);
      } else {
        this.box.contener.adopt(this.options.content);
      }
      this.box.contener.buttons = new Element('div',{'class': 'buttons'}).injectBottom(this.box.contener);
    }
    
    this.box.contener.buttons.empty();
    
    if(this.options.buttons.length) {
      for(var i=0; i<this.options.buttons.length; i++) {
        var label = this.options.buttons[i].label || '';
        var button = $(nk.misc.create_button(label)).addClass(this.options.buttons[i].extra_class || '');
        
        if($type(this.options.buttons[i].onClick) == 'function') {
          button.addEvent('click', this.options.buttons[i].onClick.bind(this));
        }
        
        if($type(this.options.buttons[i].close) == false || this.options.buttons[i].close == true) {
          button.addEvent('click', this.close.bind(this));
        }
        
        this.box.contener.buttons.grab(button);
      }
    }
    if(this.options.draggable && this.options.has_top) {
      this.box.top.setStyle('cursor','move');
    }
    
    var height = 0;
    if( this.options.has_top ) {
      height = Math.floor(this.options.height.toInt() + this.box.top.getHeight());
    } else {
      height = Math.floor(this.options.height.toInt());
    }
    this.box.setStyles({
      'width': Math.floor(this.options.width.toInt()), 
      'height': height
    });
    
    if(this.options.position) {
      this.center(this.options.position);
    } else {
      this.center();
      this.options.position = this.box.getPosition();
    }
    
    this.fireEvent('show');
  },
  
  /**
   * Center box
   */
  center: function(position) 
  {
    var size = window.getSize();
    var scroll = window.getScroll();
    var width = this.options.width.toInt();
    
    if(this.options.height == 'auto' || this.options.height == '') {
      var height = this.box.getHeight();
    } else {
      if( this.options.has_top ) {
        var height = this.options.height.toInt() + this.box.top.getHeight() + this.box.bottom.getHeight();
      } else {
        var height = this.options.height.toInt() + this.box.bottom.getHeight();
      }
    }
    
    if($type(position) == 'object' && position.x && position.y) {
      var x = position.x, y = position.y;      
    } else {
      if(this.support_position_fixed()) {
        var x = (size.x/2 - width/2).toInt();
        var y = Math.max(size.y/2 - height/2, 0).toInt();
      } else {
        var y = Math.max(size.y/2 - height/2 + scroll.y, 0).toInt();
        var x = Math.max(size.x/2 - width/2 + scroll.x, 0).toInt();
      }
    }
    
    if(this.support_position_fixed()) {
      this.box.setStyles({ 'position': 'fixed', 'top': y, 'left': x });
    } else {
      this.box.setStyles({ 'top': y, 'left': x });
      document.html.style.overflow = 'hidden';
      document.html.style.overflowY = 'hidden';
    }
    
    if(this.options.draggable) {
      if($type(this.drag)) {
        this.drag.detach();
      }
      
      this.drag = this.make_draggable({
        'limit': {
          'x': [0, Math.max(0, size.x - width)], 
          'y': [0, Math.max(0, size.y - height)]
        },
        onComplete: function() {
          this.options.position = this.box.getPosition();
        }.bind(this)
      });
    }
  },

  /**
   * Center overlayer
   */
  center_overlay : function() {
    var size = window.getSize();
    var scroll = window.getScroll();
    this.overlay.setStyle('top', scroll.y - 600);
    this.overlay.setStyle('height', size.y + 1000);
    
    if(this.support_position_fixed()) {
      this.overlay.setStyles({
        'position': 'fixed',
        'top': this.overlay.getStyle('top').toInt() - window.getScroll().y,
        'left': this.overlay.getStyle('left').toInt() - window.getScroll().x
      });
    }
  },  
  
  make_draggable: function(options) {
    if( !this.options.has_top ) return null;
    try{      
      return new Drag(this.box, $extend({'handle': this.box.top},options));
    } catch(e) {
      return null;
    }
  },
  
  save: function()
  {
    this.stack.push(this.options);
  },
  
  restore: function()
  {
    this.update(this.stack.length ? this.stack.pop() : {});
  },
  
  /**
   * Close popup
   */
  close: function() 
  {
    this.box.destroy();
    
    if(this.overlay) {
      this.overlay.setStyle('display', 'none').destroy.delay(100, this.overlay);
    }
    if(!this.support_position_fixed()) {
      document.html.style.overflow = 'auto';
      document.html.style.overflowY = 'scroll';
    }
    
    this.fireEvent('onClose');    
  },
  
  /**
   * Check position fixed support
   * 
   * @return boolean - true if support
   */
  support_position_fixed: function() 
  {
    return !(Browser.Engine.trident && Browser.Engine.version <= 4)    
  }
  
});

PopupConfig = {
  loading: '<div class="popup_load"><span class="hidden">Ładowanie...</span></div>',
  ajax_error: 'Wystąpił błąd. Przepraszamy.<br>Odśwież stronę lub zaloguj się ponownie.'
};
