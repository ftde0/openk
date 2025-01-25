var QuickMenuModuleAbstract = new Class({
  Implements: [Options, Events],
  
  options: {
    ads: false,
    href: '#',
    title: '',
    button: null,
    params: {}
  },
  
  id: 0,
  window: null,
  
  count: 0,
  counter: null,
 
  size: null,
  size_diff: 190,
  is_opened: false,
  first_open: true,
    
  initialize : function(options)
  {
    this.setOptions(options);    
    
    this.counter = this.options.button.getElement('span.quick_menu_counter');
    this.counter.content = this.counter.getElement('strong');    
        
    this.options.button.addEvent('click', this.toggle.bindWithStopEvent(this));
        
    this.create_window(this.options.title, this.options.href);
    this.init();
  },
  
  init: function()
  {
    this.size = window.getSize();
    $(window).addEvent('resize', this.resize_window.bind(this));
  },
  
  show: function(box)
  { 
    this.is_opened = true;    
    this.options.button.addClass('active');
    
    if(this.first_open) {
      this.get_data();
      this.first_open = false;
    }
    if(this.options.ads) {
      QuickMenuAds.get_ads(box, function(content) {
        if(content.trim().length) {
          this.window.ads.set('html', content);
          this.window.ads.setStyle('display', 'block');          
        } else {
          this.window.ads.setStyle('display','none');
        }
        this.resize();
      }.bind(this));
    }
  },
  
  hidden: function() 
  {
    this.is_opened = false;
    this.options.button.removeClass('active');
  },
  
  toggle: function()
  {
    this.fireEvent(this.is_opened ? 'hidden' : 'show', this);
  },
  
  resize: function()
  {    
    this.window.container.wrapper.setStyle('height', this.size.y - this.size_diff);
  },

  resize_window: function()
  {
    this.size = window.getSize();
    this.resize();
  },

  set_counter: function(v) 
  {
    this.count = v.toInt();
    if(this.count > 0) {
      this.counter.removeClass('hidden');
      this.counter.content.set('text', this.count);
    } else {
      this.counter.addClass('hidden');
    }
  },
   
  create_window: function(title, href)
  {
    this.window = new Element('div', {
      'class': 'quick_window',
      'events': {
        'click': function(e) { e.stopPropagation(); Avatar.hide_all_options(); }
      }
    }).inject(this.options.button);
    
    this.window.container = new Element('div', {
      'class': 'quick_window_content'
    });    
    this.window.container.bottom = new Element('div', { 
      'class': 'quick_window_bottom'
    });
    this.window.container.wrapper = new Element('div', { 
      'class': 'quick_window_wrapper'
    });
    this.window.header = new Element('div', {
      'class': 'quick_window_header'
    });
    this.window.header.l = new Element('div', {
      'class': 'header_left left'
    });
    this.window.header.r = new Element('div', {
      'class': 'header_right right'
    });
    this.window.header.t = new Element('h4', { 
      'html': '<a href="' + href + '" title=""><span class="raquo">&raquo;</span>' + title +'</a>'
    });
    this.window.header.close = new Element('span', {
      'class': 'close',
      'text': 'Zamknij',
      'events': {
        'click': this.toggle.bind(this)
      }
    });
  
    if(this.options.ads) {
      this.window.ads = new Element('div', {
        'class': 'quick_window_ads',
        'styles': {
          'display': 'none'
        }
      });
    }

    this.window.adopt(this.window.header, this.window.ads, this.window.container);
    this.window.header.adopt(this.window.header.l, this.window.header.t, this.window.header.r, this.window.header.close);
    this.window.container.adopt(this.window.container.wrapper, this.window.container.bottom);
  },  

  get_ads_height: function()
  {
    if(this.options.ads) {
      return this.window.ads.getHeight();
    }
    return 0;
  },

  get_data: function()
  {
    
  } 

});

var TopNavigationModuleEvents = new Class({
  Extends: QuickMenuModuleAbstract,

  id: 2,
  timer_id: null,
  size_diff: Browser.Engine.presto ? 209 : 189,
  content_loaded: false,
  
  init: function()  
  {
    this.parent();
    ClientStorage.wait_storage(function(){
      this.cache = ClientStorage.get_storage();
      this.get_data();
    }.bind(this));
  },

  show: function()
  {
    this.parent(2);
    if(this.content_loaded == false) {
      this.resize();
      this.window.container.addClass('loading');
    }
    if(this.count > 0 && this.first_open == false) {
      this.get_data();
    }
  }, 
  
  create_window: function(title, href)
  {
    this.parent(title, href);
    this.window.container.bottom.set('html','<a class="hint" title="Przejdź do działu FAQ" href="/faq#nowe_funkcjonalnosci">&nbsp;<span>Ostatnie wydarzenia dotyczące Twoich znajomych</span></a>');
  },
    
  update: function(response)
  {
    if(response.STATUS == 'OK' && response.RESPONSE) {
      
      this.set_counter(response.RESPONSE.unwatched_count);
      
      if(response.RESPONSE.last_watched_id) {
        this.set_counter(0);
      }
      if(response.RESPONSE.content) {
        this.window.container.removeClass('loading');
        if(response.RESPONSE.count > 0 || response.RESPONSE.content.match(/class="event (name_day|birthday)"/)) {
          this.window.container.wrapper.set('html', response.RESPONSE.content);
          this.window.container.bottom.empty().adopt(this.remove = this.window.container.wrapper.getElements('form.remove_all_events, a.more, a.hint').dispose());
          this.window.container.wrapper.getElements('a').flatten().each( function(item) {
            switch(item.get('class')) {
              case 'photo_thmb': var type = 'photo';
                break;
              case 'event_gift': var type = 'gift';
                break;
              default: var type = 'link';                
            }
            item.set('href', '/quickmenu/redirect?source=qm&type=' + type + '&target=' + item.get('href'));
          });

          if(this.window.container.wrapper.getElement('table.event') != null) {
            new AjaxForm(this.remove[0], {
              onRequest: function() {
                this.window.container.wrapper.addClass('loading');
              }.bind(this),
              onSuccess: function() {
                this.window.container.wrapper.removeClass('loading');
                this.clear();
              }.bind(this)
            });
          } else {
            this.remove[0].destroy();
          }
        } else {
          this.window.container.wrapper.set('html','<p class="no_events">Lista powiadomień jest pusta</p>');
        }
        this.content_loaded = true;
      }
    }
  },
  
  resize: function()
  {
    this.window.container.wrapper.setStyle('height', this.size.y - this.size_diff - this.get_ads_height());
  },

  get_data: function() {
    if(this.timer_id !== null) {
      $clear(this.timer_id);
    }

    new Request.NK({
      'url': '/events/get/' + [this.is_opened ? 1 : 0, this.content_loaded ? 1 : 0, this.options.params.eli].clean().join('/'),
      'method': 'get',
      'onSuccess': function(response) {
        if(response.STATUS == 'OK') {
          if(response.RESPONSE.last_watched_id && response.RESPONSE.last_watched_id > this.options.params.eli) {
            this.options.params.eli = response.RESPONSE.last_watched_id;
          }
          this.update(response);
        } else {
          this.window.container.removeClass('loading');
          this.window.container.wrapper.set('html','<p class="no_events">Lista powiadomień jest pusta</p>');
        }
        this.resize();
        this.timer_id = this.get_data.delay(this.options.params.check_interval * 1000, this);
      }.bind(this),
      
      on_failure: function() {
        this.timer_id = this.get_data.delay(this.options.params.check_interval * 1000, this);
      }.bind(this)
    }).send();    
  },

  clear: function() {
    this.window.container.wrapper.getElements('div.watched_events').each( function(item) {
      if(item.getElement('div.event.name_day') || item.getElement('div.event.birthday')) {
        item.getElements('table.event').destroy();
      } else {
        item.destroy();
      }
    });
    this.remove[0].destroy();
  }
});

var TopNavigationModuleMails = new Class({
  Extends: QuickMenuModuleAbstract,
  
  id: 1,  
  page: 1,
  list: {},
  show_id: null,
  size_diff: 264, 
  first_open: true,
  mailbox_type: 'inbox',
  
  init: function()
  {
    this.parent();

    MailsObserver.addEvents({
      new_mails: function(count) {
        if(this.count != count && this.page == 1 && this.is_opened && this.mailbox_type != 'inbox_read' ) {
          this.get_data(1, this.mailbox_type, false);
        }
        this.set_counter(count);
      }.bind(this),
      
      read_mails_success: function(ids) {
        if(this.mailbox_type == 'inbox_unreaded') {
          this.get_data(Math.max(this.container.getElements('li').length == ids.length ? this.page - 1 : this.page, 1), this.mailbox_type, false);
        } else {
          for(var i=0, l=ids.length; i<l; i++) {
            if(this.list[ids[i]]) {
              this.list[ids[i]].removeClass('unread').addClass('read');
            }
          }
        }
      }.bind(this),

      trash_mails_success: function(ids) {
        this.window.container.removeClass('hidden');
        this.window.container_view.addClass('hidden');
        this.get_data(Math.max(this.container.getElements('li').length == ids.length ? this.page - 1 : this.page, 1), this.mailbox_type, false);
      }.bind(this),
    
      saved_mails_success: function(ids) {
        this.window.container.removeClass('hidden');
        this.window.container_view.addClass('hidden');
        this.get_data(Math.max(this.container.getElements('li').length == ids.length ? this.page - 1 : this.page, 1), this.mailbox_type, false);
      }.bind(this)
      
    });
  },  
  
  create_window: function(title, href)
  {
    this.parent(title, href);
    
    this.window.container_view = new Element('div', {
      'class': 'quick_window_content view_mail hidden'
    }).inject(this.window);
        
    this.window.container.bottom.destroy();
    this.window.container.wrapper.addClass('mails');
    
    this.window.container.thead = new Element('div', {
      'class': 'thead',
      'html': '<div class="person_date">Nadawca/Data</div><div class="title">Temat/Treść</div><div class="trash">Kosz</div>'
    }).injectTop(this.window.container);
    
    
    this.window.container.tabs = new Element('div', {
      'class': 'mail_tabs hidden',
      'html': '<span>Wyświetl:</span>'
    });
    this.window.container.tabs.mails_all = new Element('a', {
      'href': '#wszystkie',
      'html': 'Wszystkie<span></span>',
      'class': 'all active',
      'events': {
        'click':  function(e) {
          this.window.container.tabs.mails_all.addClass('active');
          this.window.container.tabs.mails_unread.removeClass('active');
          this.window.container.tabs.mails_readed.removeClass('active');
          this.get_data(1, this.mailbox_type = 'inbox');
        }.bindWithStopEvent(this)
      }
    });
    this.window.container.tabs.mails_readed = new Element('a', {
      'href': '#przeczytane',
      'html': 'Przeczytane<span></span>',
      'class': 'readed',
      'events': {
        'click':  function(e) {
          this.window.container.tabs.mails_all.removeClass('active');
          this.window.container.tabs.mails_unread.removeClass('active');
          this.window.container.tabs.mails_readed.addClass('active');
          this.get_data(1, this.mailbox_type = 'inbox_read');          
        }.bindWithStopEvent(this)
      }
    });
    this.window.container.tabs.mails_unread = new Element('a', {
      'href': '#nieprzeczytane',
      'html': 'Nieprzeczytane<span></span>',
      'class': 'unreaded',
      'events': {
        'click': function(e) {
          this.window.container.tabs.mails_all.removeClass('active');
          this.window.container.tabs.mails_unread.addClass('active');
          this.window.container.tabs.mails_readed.removeClass('active');
          this.get_data(1, this.mailbox_type = 'inbox_unread');
        }.bindWithStopEvent(this)
      }
    });
    this.window.container.tabs.injectTop(this.window.container);
    this.window.container.tabs.adopt(this.window.container.tabs.mails_all, this.window.container.tabs.mails_readed, this.window.container.tabs.mails_unread);
    
    
    this.window.container.buttons = new Element('div', {
      'class': 'mail_buttons'
    });
    this.window.container.buttons.paginator = new Element('div', {
      'class': 'paginator_wrapper'
    });    
    this.window.container.buttons.actions = new Element('div', {
      'class': 'mail_actions'
    });    
    this.window.container.buttons.actions.select_all = new Element('span', {
      'text': 'Zaznacz wszystkie',
      'class': 'filter',
      'events': {
        'click': function(e) { 
          for(var i in this.list) {
            this.list[i].checkbox.input.checked = true;
          }
        }.bind(this)
      }
    });    
    this.window.container.buttons.actions.select_none = new Element('span', {
      'text': 'Odznacz wszystkie',
      'class': 'filter',
      'events': {
        'click': function(e) {
          for(var i in this.list) {
            this.list[i].checkbox.input.checked = false;
          }
        }.bind(this)
      }
    });    
    this.window.container.buttons.actions.run = new Element('select', {
      'class': 'actions',
      'html': '<option value="none">Czynności</option><option value="trash">Przenieś do kosza</option><option value="read">Oznacz jako przeczytane</option><option value="saved">Zapisz</option>',
      'events': {
        'change': function(e) {
          this.execute_action(e.target.get('value'));
          e.target.set('value','none');
        }.bindWithStopEvent(this)
      }
    });
    
    this.window.container.buttons.injectTop(this.window.container);
    this.window.container.buttons.adopt(this.window.container.buttons.actions, this.window.container.buttons.paginator);
    this.window.container.buttons.actions.adopt(this.window.container.buttons.actions.select_all, this.window.container.buttons.actions.select_none, this.window.container.buttons.actions.run);
  },
  
  render_mail: function(data)
  {
    var item =  new Element('li', {
      'class': 'row ' + data.row_class
    });
    
    item.container = new Element('div', {
      'class': 'border'
    });
    
    item.from = new Element('div', {
      'class': 'od',
      'html': data.person
    });
    
    item.message = new Element('div', {
      'class': 'msg',
      'html': data.msg,
      'events': {
        'click': this.get_mail_content.bindWithStopEvent(this, data.id)
      }
    });
    
    item.remove = new Element('div', {
      'class': 'dust_bin',
      'html': '<button title="Kosz"><img src="' + getStaticUri('/img/delete.png') + '" alt="Kosz"></button>',
      'events': {
        'click': function(e, id) {
          if(item.remove.hasClass('loading') == false) {
            item.remove.addClass('loading');
            this.execute_action('trash', id);
          }
        }.bindWithStopEvent(this, data.id)
      }
    });
    
    item.checkbox = new Element('div', {
      'class': 'checkbox'      
    });
    
    item.checkbox.input = new Element('input', {
      'type': 'checkbox',
      'value': data.id,
      'events': {
        'click': function(e,item) { item.toggleClass('checked'); }.bindWithEvent(this, item)
      }
    });         
    
    return item.grab(item.container.adopt(item.checkbox.grab(item.checkbox.input), item.from, item.message, item.remove));
  },
  
  show: function()
  {
    this.parent(1);
    this.resize();
  },
  
  hidden: function() 
  {
    this.parent();
    this.window.container_view.addClass('hidden').getElements('div').destroy();
    this.window.container.removeClass('hidden');
  },
    
  show_mail: function(data, id)
  {
    this.window.container_view.set('html', data).removeClass('loading');
    
    this.window.container_view.getElement('div.message_container').setStyle('height', this.window.container_view.getHeight() - 112);
    
    this.window.container_view.getElement('a.back_to_xbox').addEvent('click', function(e) {
      this.show_id = null;
      this.window.container.removeClass('hidden');
      this.window.container_view.addClass('hidden');
    }.bindWithStopEvent(this));
    
    this.window.container_view.getElements('button.type_1').addEvent('click', function(e) {
      var el = e.target.hasClass('type_1') ? e.target : e.target.getParent('button');
      this.execute_action(el.get('class').match(/type_1 (.*)/).pop(), id);      
    }.bindWithStopEvent(this));
    
    this.window.container_view.getElements('a.next, a.prev').addEvent('click', function(e) {      
      this.get_mail_content(e, e.target.href.match(/poczta\/([\d]+)/).pop().toInt());      
    }.bindWithStopEvent(this));    
    
    Avatar.catch_avatars(this.window.container_view.getElements('div.avatar_no_js'), this.window.container_view.getElements('div.avatar'));
    SledzikObserver.parse(this.window.container_view.getElements('span.parser'));
  },
  
  get_mail_content: function(e, id)
  {
    this.show_id = id;
    this.window.container.addClass('hidden');
    this.window.container_view.removeClass('hidden').addClass('loading');
    
    MailsObserver.get_mail(id, this.show_mail.bind(this));
  },
  
  resize: function()
  {
    this.window.container_view.setStyle('height', this.size.y - this.size_diff + 99 - this.get_ads_height());
    this.window.container.wrapper.setStyle('height', this.size.y - this.size_diff +25 - this.get_ads_height() - this.window.container.tabs.getHeight());
    if(this.show_id) {
      var el = this.window.container_view.getElement('div.message_container'); 
      if(el) {
        el.setStyle('height', this.window.container_view.getHeight() - 112);
      }
    }
  },
  
  update: function(data, show_navigation)
  {
    if(this.container) {
      this.container.destroy();
    } else {
      this.container = new Element('ul', { 'class': 'mail entry-content' }); 
    }
    if(show_navigation) {
      this.window.container.tabs.removeClass('hidden');
    } else {
      this.window.container.tabs.addClass('hidden');
    }
     
    this.list = {};
    this.window.container.wrapper.grab(this.container);
     
    if(data.length ==0) {
      this.container.grab(new Element('li', {'class':'empty_box', 'text': 'W tym folderze nie ma żadnych wiadomości'}));
    } else {
      for(var i=0, l=data.length; i<l; i++) {
        this.container.grab(this.list[data[i].id] = this.render_mail(data[i]));
      }
    }
    
    this.window.container.wrapper.scrollTo(0,0);
  },
  
  get_data: function(page, box, loading)
  {    
    this.page = page ? page : 1;
    var limit = 20, offset = (this.page-1) * limit, loading = $type(loading) ? loading : true;
    
    if(loading) {
      this.window.container.wrapper.addClass('loading');
    }
    
    MailsObserver.get_mail_list(box || 'inbox', offset, limit, function(list, count, show_navigation) {
      this.update(list, show_navigation);
      this.window.container.wrapper.removeClass('loading');
      this.paginator = new Paginator(count, this.page, limit, 'graphic_paginator', 2, function(page) { this.get_data(page, this.mailbox_type); }.bind(this), this.window.container.buttons.paginator);
      this.paginator.refresh();
    }.bind(this));
  },
      
  execute_action: function(action, id)
  { 
    var ids = [], action = action || 'none';    
    
    if(id) {
      ids = [id];
    } else {
      for(var i in this.list) {
        if(this.list[i].checkbox.input.checked) {
          ids.push(this.list[i].checkbox.input.value);
        }
      }
      if(ids.length == 0) {
        return ;
      }
    }

    switch(action)
    {
      case 'read':  MailsObserver.move_mails(ids, 'read');  break;        
      case 'trash': MailsObserver.move_mails(ids, 'trash'); break;
      case 'saved': MailsObserver.move_mails(ids, 'saved'); break;
      case 'repply': window.location.href = '/poczta/'+ ids[0] + '#mail_info_box';
    }
  },
  
  clear_list: function(ids)
  {
    for(var i=0, l=ids.length; i<l; i++) {
      if(this.list[ids[i]]) {
        this.list[ids[i]].destroy();
        delete this.list[ids[i]]; 
      }
    }
    
    if(this.is_empty(this.list)) {
      
    }
  },
  
  is_empty: function(object)
  {
    for(var i in object) {
      if(object.hasOwnProperty(i)) {
        return false;
      }
    }
    return true;
  }
});


var TopNavigationModuleSledzik = new Class({
  Extends: QuickMenuModuleAbstract,
  Implements: [SledzikController],

  id: 3,
  list_count: 10,
  new_count: 0,
  timestamp: 0,
  
  first_open: true,
  add_shout_source: 4,
  
  init: function()
  {
    this.parent();

    SledzikObserver.addEvents({
      new_shouts: function(count, timestamp) {
        this.timestamp = timestamp,
        
        this.set_counter(count);
        if(count > 0) {
          if(this.first_open == false) {
            this.window.container.info.set('text', 'Pokaż '+ dopasuj_do_liczebnika(count,' nowy wpis', count +' nowe wpisy', count +' nowych wpisów')).removeClass('hidden');
          }
        }
      }.bind(this),
      
      add_shout_success: function() {
        this.list_count++;
        this.window.container.wrapper.scrollTo(0,0);
      }.bind(this),
      
      remove_shout_success: function() {
        this.list_count--;
      }.bind(this),
      
      hidden_shout_success: function() {
        this.list_count--;
      }.bind(this),
      
      remove_followee: function() { 
        this.counters[1].set('text',this.counters[1].get('text').toInt()-1); 
      }.bind(this)
    });
  
    this.init_controller()
    ClientStorage.wait_storage(function() {
      this.init_form_events();
      this.init_observer_events();
    }.bind(this));
    
    this.form.textarea.addEvent('click', this.resize.bind(this, window.getSize()));
    
    this.window.container.addEvent('click', function(e) {
      for(var uid in this.list) {
        for(var id in this.list[uid]) {
          if(e.target != this.list[uid][id].menu.show) {
            this.list[uid][id].show_menu(false);
          }
        }
      }
    }.bind(this));
    
    this.renderer = new SledzikPromotedBoxSledzikAvatar();
  },
  
  show: function()
  {
    if(this.first_open) {            
      this.star_box = new SledzikStarBox();
      this.star_box.create_box();

      this.friends_box = new SledzikFriendsBox();
      this.friends_box.create_box();

      this.promoted_box = new SledzikPromotedBox();      
      this.promoted_box.renderer.type = 7;
      this.promoted_box.create_box();
  
      this.window.container.wrapper.left.adopt(this.friends_box.box, this.star_box.box, this.promoted_box.box);
      this.set_counter(0);
    } else {
      if(this.count > 0) {
        this.get_new_shouts();
      }
    }
    
    this.parent(3);
        
    this.promoted_box.is_opened = this.is_opened;
    this.resize();
    this.window.container.wrapper.scrollTo(0,0);
  },
    
  hidden: function() 
  {
    this.parent();
    this.promoted_box.is_opened = this.is_opened;
  },
  
  create_window: function(title, href)
  {
     this.parent(title, href);
     this.box = {};
     
     this.form = this.create_send_form();
     
     this.window.container.info = new Element('span', {
       'text': 'Pokaż nowe wpisy',
       'class': 'show_new hidden',       
       'events': { 'click': this.get_new_shouts.bind(this) }
     });
     
     this.window.container.wrapper.left = new Element('div', {
       'class': 'quick_window_left'
     });     
     this.window.container.wrapper.sledzik = new Element('div', {
       'class': 'quick_window_right sledzik'
     });
     this.window.container.wrapper.sledzik.shouts = new Element('div', {
       'class': 'shout_collection'
     });
     this.window.container.wrapper.sledzik.more = new Element('span', {
       'text': 'Pokaż więcej', 
       'class': 'show_more',
       'events': {
         'click': function(e) {
           if(this.window.container.wrapper.sledzik.more.hasClass('loading')) {
             return;
           }
           
           var limit = 10, offset = this.count + this.list_count;
           
           this.window.container.wrapper.sledzik.more.addClass('loading');
           
           SledzikObserver.get_shouts(offset, limit, null,  function(list) {
             var temp = this.add_shouts(list, 'static_bottom');
             
             if(offset >= 40) {
               this.window.container.wrapper.sledzik.more.addClass('hidden');
             } else {
               this.window.container.wrapper.sledzik.more.removeClass('loading');
             }             
             this.list_count += limit;
             
           }.bind(this));
         }.bind(this)
       }
     });     
           
     this.window.container.wrapper.adopt(this.window.container.wrapper.left, this.window.container.wrapper.sledzik,  new Element('div', {'class': 'clear'}));
     this.window.container.wrapper.sledzik.adopt(this.form, this.window.container.info, this.window.container.wrapper.sledzik.shouts, this.window.container.wrapper.sledzik.more);     
     this.window.container.bottom.set('html','<a href="/faq#nowe_funkcjonalnosci" title="Przejdź do działu FAQ" class="hint">&nbsp;<span>Śledzik</span></a>');
     
     this.container = this.window.container.wrapper.sledzik.shouts;
  },
  
  resize: function(size)
  {
    this.window.container.wrapper.setStyle('height', this.size.y - this.size_diff - this.get_ads_height());
  },

  update: function(response)
  {
    if(response.length) {
      this.add_shouts(response, 'static_bottom');      
    } else {
      this.window.container.wrapper.sledzik.shouts.grab(new Element('p',{'class': 'no_events', 'text': 'Lista wpisów jest pusta'}));
      this.window.container.wrapper.sledzik.more.addClass('hidden');
    }
    this.window.container.removeClass('loading');
  },
  
  get_data: function()
  { 
    if(this.first_open) {
      this.window.container.addClass('loading');
      
      SledzikObserver.get_shouts(0, 10, null, this.update.bind(this));
      this.star_box.load_box();
      this.promoted_box.load_box();
    }
    
    this.first_open = false;
  },
  
  get_new_shouts: function()
  {    
    this.set_counter(0);
    this.window.container.info.addClass('hidden');
    
    SledzikObserver.get_shouts(0, 50, this.timestamp , function(list) {
      this.list_count += this.add_shouts(list.reverse(), 'static_top').length;
      this.window.container.wrapper.scrollTo(0,0);
    }.bind(this));
  },

  create_send_form: function()
  {
    var form;
    
    form = new Element('form', {
      'class': 'sledzik_form',
      'method': 'post',
      'action': '/sledzik/shout/add'
    });
    
    form.textarea = new Element('textarea', {
      'rows': 5,
      'cols': 40,
      'text': 'Wpisz tekst lub co ciekawego robisz',
      'class': 'shout_text_input'
    });
    
    form.send = new Element('input', {
      'type': 'image',
      'class': 'send_button disabled',
      'src': getStaticUri('/img/blank[3].gif')
    });
    
    form.options = new Element('div', {
      'class': 'controll_box'
    });
    
    form.options.counter = new Element('span', {
      'text': '250',
      'class': 'counter'
    });
    
    form.options.checkbox = new Element('input',{'id': 'widget_only_friends', 'type': 'checkbox'});
    form.options.label = new Element('label',{'for': 'widget_only_friends', 'text': 'tylko do znajomych'});
          
    return form.adopt(form.textarea, form.send, form.options.adopt(form.options.counter, form.options.checkbox, form.options.label), new Element('div',{'class': 'clear'}));
  }
});
