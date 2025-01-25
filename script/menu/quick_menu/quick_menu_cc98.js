var QuickMenu = new Class( {
  Implements: Options,
  
  options: {
    ads: true  
  },
  overlay: null,
  modules: new Array(),
  current_module: null,
  
  initialize : function(options)
  {
    this.setOptions(options);
    
    var size = window.getSize();
    
    this.contener = $('quick_menu');
    this.contener.tabs = this.contener.getElements('ul li');
    this.contener.header = $('page_header');   
        
    this.modules.push(new TopNavigationModuleMails({
      title: 'Poczta',
      button: this.contener.tabs[0],
      ads: this.options.ads
    }));
    
    this.modules.push(new TopNavigationModuleEvents({
      href: '/events',
      title: 'Powiadomienia',      
      button: this.contener.tabs[1],
      ads: this.options.ads,
      params: this.options.events
    }));
    
    this.modules.push(new TopNavigationModuleSledzik({
      href: '/sledzik',
      title: 'Śledzik',
      button: this.contener.tabs[2],
      ads: this.options.ads
    }));

    for(var i=0; i<this.modules.length; i++) {      
      this.modules[i].addEvents({
        'show': this.show_module.bind(this),
        'hidden': this.hidden_module.bind(this)
      });
    }
    
    this.init_events();

    if(this.options.ads) {
      QuickMenuAds.init(); 
    }
  },

  init_events: function()
  {        
    if(this.position_fixed_support() == false) {
      $(window).addEvent('scroll', this.scroll_window.bind(this));
    }    
    $(window).addEvents({
      'resize': this.resize_window.bind(this)
    });
    $(document.body).addEvent('click', this.hidden_module.bind(this));
  },
  
  show_module: function(module)
  {
    if(this.current_module !== null) {
      this.current_module.hidden();
    }
    
    if(this.overlay === null) {
      this.overlay = new Element('div', {
        'id': 'quick_window_overlay',
        'styles': {
          'top': 0,
          'left': 0,
          'width': window.getWidth(),
          'height': window.getHeight() + 500,
          'opacity': 0.5,
          'position': this.position_fixed_support() ? 'fixed' : 'absolute'
        }
      }).inject(this.contener.header.setStyle('position','static'));
    }
    
    this.current_module = module;
    this.current_module.show();
    
    this.request = new Request.NK({
      url: '/quickmenu/hit/' + this.current_module.id,
      method: 'get'
    });
    this.request.send.delay(2000, this.request);    
  },
  
  hidden_module: function()
  {
    if(this.current_module === null) {
      return ;
    }    
    this.contener.header.setStyle('position','relative');
    this.current_module.hidden();
    this.current_module = null;
    
    this.overlay.setStyle('visibility','hidden').destroy.delay(300, this.overlay);
    this.overlay = null;
  },
  
  scroll_window: function(e)
  {        
    if(this.overlay !== null) {
      this.overlay.setStyle('top', window.getScrollTop());
    }
  },
  
  resize_window: function()
  {
    var size = window.getSize();
    
    if(this.overlay) {
      this.overlay.setStyles({
        'width': size.x,
        'height': size.y + 500
      });
    }
  },
  
  position_fixed_support: function() {
    return !(Browser.Engine.trident && Browser.Engine.version <= 4);
  }
});

QuickMenuAds = new(new Class({
  init: function()
  {
    this.iframe = new Element('iframe', {
      'src': 'javascript: void(0)',
      'styles': {
        'display': 'none'
      }
    }).injectTop($(document.body));
  },

  get_ads: function(type, callback)
  {
    if(this.callback || (window.location.protocol == 'https:')) {
      return false;
    }
    this.callback = callback;
    this.iframe.set('src', '/quickmenu/ads/'+type);

    return true;
  },

  readed_ads: function(content)
  {
    if(this.callback) {
      this.callback(content);
      this.callback = null;
    }
  }
}))();

$(window).addEvent('menuready_nk', function() {  
  new QuickMenu(nk_options.quick_menu);
});
