var SledzikShoutBox = new Class({
  Implements: [SledzikController],
    
  page: 1,
  box_style: 'open',
    
  /**
   * Konstruktor klasy
   *
   * @param config - obiekt konfiguracyjny
   */
  initialize : function(config)
  {
    this.setOptions($extend({
      shout_in_box: 5,
      shout_show_without_clean: 10
    }, config ));
    
    this.options = $extend(this.options, config);
    
    this.init_controller();
  },

  /**
   * Funkcja wywoływana w celu przechwycenia zdarzeń obiektów sledzika
   */
  init: function()
  {
    this.cache = ClientStorage.get_storage();

    var that = this;
    if(this.box = $('sledzik_box')) {
      this.container = $('shout_collection');
      this.box.info = $('sledzik_info_box');  
      this.box.paginator = this.box.getElements('div.paginator.sledzik_shout_paginator');      
      this.box.open_close_button = this.box.getElement('div.cool_box_header_right span.box_style');      
    } else {
      return;
    }
    
    this.box_style = Cookie.read('sledzik_box_style') || 'open';
    
    if(this.container) {
      this.add_shouts(this.container.getChildren('div.sledzik_shout').reverse(), 'none');
    }

    this.init_observer_events();
 
    if(this.options.auto_shout_download && this.box_style == 'open') {
      SledzikObserver.addEvent('new_shouts', function(count, recent, ids) {
        for(var i=ids.length-1; i>=0; i--) {
          if(ids[i].timestamp <= this.options.last_timestamp && count > 0) {
            count--;
          }
        }
        if(count > 0) {
          this.new_shout_message(this.shout_list_waiting_count = count);
        }
        this.timestamp = recent;
      }.bind(this));
    }
    
    if(/page=([\d]+)/.test(window.location.href)) {
      this.page = window.location.href.match(/page=([\d]+)/).pop().toInt();      
    }
    
    if(this.form = $('sledzik_form')) {
      this.form.send = this.form.getElement('input.send_button');
      this.form.loading = $('ajax_loading_image');
      this.form.options = this.form.getElement('div.controll_box');
      this.form.options.counter = $('char_count');
      this.form.options.checkbox = $('sledzik_form_only_friends');
      this.form.textarea = this.form.getElement('textarea');
      if(this.form.textarea.get('value').length == 0) {
        this.form.textarea.set('value','Napisz co teraz robisz, o czym myślisz lub prześlij ciekawy link');
      }
      this.init_form_events();
    }

    if(this.box.open_close_button && this.form) {
      this.box.open_close_button.addEvent('click', function() {
        this.box.removeClass(this.box_style);
        var shouts = this.container.getElements('div.sledzik_shout');
        
        if(this.box_style == 'open') {
          this.box_style = 'close';
          for(var i=2, l=shouts.length; i<l; i++) {
            shouts[i].addClass('hidden');                
          }
        } else {
          this.box_style = 'open';
          for(var i=2, l=shouts.length; i<l; i++) {
            shouts[i].removeClass('hidden');                
          }
        }
        
        this.box.addClass(this.box_style);
        Cookie.write('sledzik_box_style',this.box_style);
        
      }.bind(this));
    }

    if(this.form && /shout=(.+)/.test(window.location.href)) {
      new SledzikWidgetShoutSender({
        content: decodeURIComponent(window.location.href.match(/shout=(.+)/).pop().split('&').shift()) 
      });
    }
    
    this.box.paginator.each( this.catch_paginator_events.bind(this) );
  },
  
      
  /**
   * Pobiera dane 
   */
  change_page: function(url) 
  {
    var param = url.match(/page=([\d]+)/), url = null;
    
    if(param.lenght == 0) {
      return;
    }
    
    this.page = param[1];    
    
    switch(this.options.box_type) {
      case 'box':
        url = '/sledzik/shout/box?page='+this.page; 
        break;
      case 'user':
        url = '/sledzik/shout/user/'+this.options.watched_uid+'?page='+this.page;
        break;
        
      default:
        return;
    }
    
    new Request.NK({
      url: url,
      method: 'get',
      
      onRequest: this.loading.bind(this, true),
      onFailure: this.loading.bind(this, true),
      
      onSuccess: function(response) {
        if(SledzikObserver.options.slt < response.TIMESTAMP) {
          SledzikObserver.options.slt = response.TIMESTAMP;
        }
        this.list = {};
        var temp = new Element('div',{html: response.DATA});
        var collection = temp.getElement('div.shout_collection').dispose();
        this.add_shouts(collection.getElements('div.sledzik_shout').reverse(), 'none');
        
        var paginators = temp.getElements('div.paginator').each(function(item,index) {
          this.catch_paginator_events(item).replaces( this.box.paginator[index] );
          this.box.paginator[index].destroy();
          this.box.paginator[index] = item;
        }.bind(this));
        
        collection.replaces(this.container);
        this.container.destroy();
        this.container = collection;

        this.loading(false);
        temp.destroy();
      }.bind(this)
    }).send();    
  },
  
  /**
   * Funkcja przechwytuje event-y paginatora
   * 
   * @param Element {paginator} - paginator
   */
  catch_paginator_events: function(paginator) {
    paginator.getElements('a').addEvent('click', function(e) { 
      this.change_page(e.target.href || $(e.target).getParent('a').href); 
    }.bindWithStopEvent(this));
    return paginator;
  },
  
  show_shouts: function(e)
  {   
    this.box.info.empty();
    if(this.is_empty(this.list)) {
      this.container.empty();
    }
    
    if((SledzikObserver.count < this.options.shout_show_without_clean && this.page == 1) || this.box.paginator.length == 0) {
      SledzikObserver.get_shouts(0, this.options.shout_show_without_clean, this.timestamp, function(content) {
        if(this.shout_list_waiting_count >= this.options.shout_show_without_clean) {
          var container = new Element('div', {
            'id': 'shout_collection',
            'class': 'shout_collection'
          }).replaces(this.container);
          this.container.destroy();
          this.container = container;
        }
        this.add_shouts(content.reverse(), 'static_top');
      }.bind(this));
    } else {
      this.change_page(this.box.paginator[0].getElement('a.page_nr').get('href'));
    }
  },

  add_shout_action: function(response)
  {
    if(this.page == 1) {
      this.add_shout(response.RESPONSE.SHOUT.content, 'animation', true);
    } else {
      this.box.info.empty();
      this.box.info.grab(Element('span', {
        'text': 'Twój wpis został dodany. Kliknij aby go zobaczyć',
        'events': {
          'click' : function(e) {
            this.box.info.empty();
            this.change_page(this.box.paginator[0].getElement('a.page_nr').get('href'));
          }.bind(this)
        }
      }));
    }
  },
  
  new_shout_message: function(count)
  {
    var message = new Element('span', {
      'text': 'Pokaż '+ dopasuj_do_liczebnika(count, ' nowy wpis', count+ ' nowe wpisy', count + ' nowych wpisów'),
      'events': {    
        'click': this.show_shouts.bind(this)
      }
    });
    
    this.box.info.empty();
    this.box.info.grab(message);
  }

});

$(window).addEvent('domready_nk',function() {
  var box = new SledzikShoutBox(nk_sledzik);
  ClientStorage.wait_storage(box.init.bind(box));
})
