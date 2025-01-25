var SledzikObserver = new (new Class({
  Extends: Events,
  Implements: Options,
  
  options: {
    connection: {
      delay_get_new: 10000,
      delay_add_new: 6000
    },
    messages: {
      'add_followee': 'Czy chcesz zacząć śledzić tę osobę?<br>Od tej chwili będziesz widzieć jej wpisy na Śledziku.',
      'remove_followee': 'Czy chcesz przestać śledzić tę osobę?<br>Od tej chwili nie będziesz widzieć jej wpisów na Śledziku!'       
    },
    last_watched_timestamp: 0
  },
  
  tid: null,
  count: null,
  new_shout_ids: new Array(),
  added_shouts_ids: new Array(),
  
  followee_list: null, 
  follower_list: null,
  promoted_list: null,
  
  addEvent: function(ev, fn)
  {
    this.parent(ev, fn);
    
    if(ev == 'new_shouts') {
      if(this.tid  == null) {
        this.tid = 0;
        this.get_count();
      } else if(this.count !== null) {
        fn(this.count, this.options.slt+1, this.new_shout_ids);
      }
    }
  },
   
  initialize : function(options)
  {
    this.setOptions(options);
  },

  init: function()
  {
    if(this.options.parser.use_parser) {
      this.parser = new UrlParser();
    }
    if(this.options.parser.use_analytics) {
      try {
        this.analytics = new UrlGoogleStatistic();
      } catch(e) {}
    }
  },
  
  error: function(errors, title)
  {
    switch($type(errors)) {
      case 'string':
        var msg = errors;
        break;
      case 'array':
        if (errors.length == 1) {
          var msg = errors[0];
        } else {
          var msg = new Element('ul', { 'class': 'popup_form_errors' });
          for (var i=0; i<response.RESPONSE.FORM_ERRORS.length; i++) {
            msg.grab(new Element('li', {'text': errors[i]}));
          }
        }
        break;
      default: var msg = 'Błedne dane';
    }
    
    new Popup({
      title: title || 'Błąd',
      content: msg,
      content_safe_mode: false,
      draggable: true,
      buttons:[{label: 'Ok'}]
    });
    
    this.fireEvent('loading', false);
  },
  
  parse: function(parse_contents)
  {
    if(this.parser && this.options.parser.use_parser) {
      this.parser.run(parse_contents, this.options.parser.use_validate);
    }
  },

  get_count: function()
  {
    new Request.NK({
      url: '/sledzik/shout/count/' + (this.options.slt+1),
      method: 'get',
      onSuccess: function(response) {
        for(var i=response.length-1; i>=0; i--) {
          if(response[i].uid == this.options.uid && this.added_shouts_ids.indexOf(response[i].id) > -1) {
            response.splice(i,1);
          }
        }
        this.fireEvent('new_shouts', [this.count = response.length, this.options.slt+1, this.new_shout_ids = response]);
        this.tid = this.get_count.delay(this.options.connection.delay_get_new, this);
      }.bind(this),
      
      onFailure: function() {
        this.tid = this.get_count.delay(this.options.connection.delay_get_new, this);
      }.bind(this)
    }).send();
  },
  
  get_shouts: function(offset, limit, timestamp, callback)
  {
    new Request.NK({
      url: '/sledzik/shout/list/' + offset + '/' + limit + (timestamp ? ('/' + timestamp) : ''),
      method: 'get',
      onRequest: function() {
        $clear(this.tid);
      }.bind(this),
      
      onSuccess: function(response) {
        for(var i=response.IDS.length-1; i>=0; i--) {
          if(response.IDS[i].uid == this.options.uid && this.added_shouts_ids.indexOf(response.IDS[i].id) > -1) {
            response.IDS.splice(i,1);
            response.DATA.splice(i,1);
          }
        }
        callback(response.DATA);

        if(this.options.slt < response.TIMESTAMP) {
          this.fireEvent('new_shouts', [this.count = 0, this.options.slt = response.TIMESTAMP, this.new_shouts_ids = []]);
        }
        this.tid  = this.get_count.delay(this.options.connection.delay_get_new, this);
      }.bind(this)
    }).send();
  },
  
  /******************************* Obsługa wpisów ********************************/ 
  add_shout: function(text, private, source)
  {
    var text = text.trim();
    
    if(text.length == 0) {
      return false;
    }
    
    new Request.FORM({
      url: '/sledzik/shout/add/js',
      ticket: this.options.tickets.add_shout,
      data: {
        source: source || 0,
        content: text,
        only_friends: (private ? 1 : 0)
      },
      
      onRequest: function() {
        this.fireEvent('loading', true);
        this.fireEvent('add_shout_disabled', this.options.connection.delay_add_new);
      }.bind(this),
      
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          this.added_shouts_ids.push(response.RESPONSE.SHOUT.id);
          this.fireEvent('add_shout_success',[response]);
          if(this.options.parser.use_analytics && this.analytics) {
            this.analytics.run(text);
          }
        } else {
          this.error(response.RESPONSE.MSG, 'Błąd dodawania wpisu');
        }
        this.fireEvent('loading', false);
      }.bind(this)
    }).send();    
  },
  
  star_shout_add: function(id, uid)
  {
    var c = new Element.NK('div', {
      'class': 'msg'
    },['span', {'class': 'info_star'}, null, 'Czy na pewno chcesz oznaczyć ten wpis gwiazdką?']);
    
    var popup = new Popup({
      title: 'Potwierdzenie',
      content: c,
      content_safe_mode: false,
      buttons: [
        {
          label: 'Tak',
          close: false,
          onClick: function() {
            new Request.FORM({
              url: '/sledzik/shout/' + uid + '/' + id + '/star/add/js',
              ticket: this.options.tickets.add_shout_star,
              onRequest: function() {
                popup.close();
              },
              onSuccess: function(response) {
                if(response.STATUS == 'OK') {                  
                  this.fireEvent('add_shout_star_success',[id, uid]);
                } else {
                  this.error(response.RESPONSE.MSG);                  
                }
              }.bind(this)
            }).send();
          }.bind(this)
        },
        { label: 'Nie' }
      ]
    });
  },

  star_shout_show: function(id, uid, my_uid)
  {
    new SledzikShoutStars('/sledzik/shout/' + uid + '/' + id + '/star', this.options.uid);
  },
  
  comment_shout_get: function(id, uid, page, callback)
  {
    var callback = callback || $empty, page = page || 1;
    new Request.NK({
      url: '/sledzik/shout/' + uid + '/' + id + '/comment/js',
      data: { page: page },
      method: 'get',
      
      onRequest: function() {
        this.fireEvent('loading', true);
      }.bind(this),
      
      onSuccess: function(response) {
        if(response.STATUS == 1) {
          callback(response.DATA, response.COUNT);
        } else {
          this.error(response.RESPONSE.FORM_ERRORS);
        }
        this.fireEvent('loading', [false, 1000]);
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd pobierania komentarzy'])
    }).send();
  },
  
  comment_shout_add: function(id, uid, text, callback)
  {
    var text = text.trim(), callback = callback || $empty, error = null;
    
    if(text.length == 0) {
      return ;
    }
    
    new Request.FORM({
      url: '/sledzik/shout/' + uid + '/' + id + '/comment/add/js',
      data: { content: text },
      ticket: this.options.tickets.add_comment,
      
      onRequest: function() {
        this.fireEvent('loading', true);
      }.bind(this),
      
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          callback(response.RESPONSE.NEW_CONTENT, response.RESPONSE.COUNT);
          this.fireEvent('add_comment_success',[id, uid, response.RESPONSE.NEW_CONTENT, response.RESPONSE.COUNT]);
        } else {                    
          if(response.RESPONSE.FORM_ERRORS.length == 1 && (error = response.RESPONSE.FORM_ERRORS[0].match(/wyłączona[a-z ]*([\d]+) sek/i))) {
            this.fireEvent('add_comment_disabled', error.pop().toInt());
            this.error(response.RESPONSE.FORM_ERRORS, 'Informacja');
          } else {
            this.error(response.RESPONSE.FORM_ERRORS);
          }
        }
        this.fireEvent('loading', [false, 1000]);
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd dodawania komentarza'])
    }).send();
  },
  
  comment_shout_remove: function(id, uid, comment_id)
  {
    new Request.FORM({
      url: '/sledzik/shout/' + uid + '/' + id + '/comment/' + comment_id + '/remove/js',
      ticket: this.options.tickets.remove_comment,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          this.fireEvent('remove_comment_success',[id, uid, response.RESPONSE.NEW_CONTENT, response.RESPONSE.COUNT]);
        } else {
          $log('bład usówania komentarza');
        }
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd usuwania komentarza'])
    }).send();
  },
  
  hidden_shout: function(id, uid, ticket)
  {    
    new Request.FORM({
      url: '/sledzik/shout/' + uid + '/' + id + '/remove/js',
      ticket: ticket,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') 
        {
          this.fireEvent('hidden_shout_success',[id, uid]);
        } else {
          this.fireEvent('hidden_shout_failure');
        }
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd usuwania wpisu'])
    }).send();    
  },
  
  remove_shout: function(id, uid)
  {
    new AjaxYesNoPageHandler('/sledzik/shout/' + uid + '/' + id + '/remove_permanent', { 
      onYes: function() {
        this.fireEvent('remove_shout_success',[id, uid]);
      }.bind(this) 
    });
  },
  
  link_shout: function(id, uid)
  {
    var input = new Element('input', {
      'type': 'text',
      'size': 55,
      'value': window.location.protocol + '//' + window.location.host + '/sledzik/shout/' + uid + '/' + id,
      'class': 'link_to_shout',
      'readonly': true
    });

    new Popup({
      'width': 400,
      'title': 'Link do wpisu',
      'extra_class': 'link_popup',
      'content': [new Element('div',{'class':'msg','text':'Naciśnij Ctrl+c aby skopiować link do schowka'}), input],
      'content_safe_mode': false,
      'buttons': [{'label': 'Zamknij'}]
    });
        
    input.focus();
    input.select();                
  },

  abuse: function(url, ticket)
  {    
    var popup = new Popup(
      {
        'title': 'Zgłoś nadużycie',
        'content': PopupConfig.loading,
        'content_safe_mode': false
      }
    );

    new Request.NK({
      url: url+'/js/get/'+ticket,
      method: 'get',
      onSuccess: function(response) {              
        popup.update({'width' : 365, 'content': response.RESPONSE.CONTENT});

        var form = popup.box.contener.getElement('form'), cancel = popup.box.contener.getElement('a');

        if(form) {
          new AjaxForm(
            form,
            {
              onSuccess: function(response) {
                popup.update({'content': response.RESPONSE.MSG, 'buttons': [{ 'label': 'Ok' }]});
              },
              onFailure: function(msg) {
                popup.close();
                this.error(msg, 'Błąd zgłaszania nadużycia');
              }.bind(this)
            }
          );
        }

        if(cancel) {
          cancel.addEvent('click', popup.close.bindWithStopEvent(popup));
        }
      }.bind(this),
      
      onFailure: function() {
        popup.close();
        this.error(PopupConfig.ajax_error, 'Błąd złaszania nadużycia');
      }.bind(this)
      
    }).send();
  },

  
  /***************************** Obsługa followersów *****************************/
  
  add_followee: function(id, type, callback) 
  {
    var p, r = new Request.FORM({
      url: '/sledzik/followee/add/js',
      data: { user_id: id , type: type || 0 },
      ticket: this.options.tickets.add_followee,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          if(this.promoted_list && (p = this.find(id, this.promoted_list)) > -1) {
            this.promoted_list[p].IS_FOLLOWEE = 1;
          }
          if(this.followee_list && (p = this.find(id, this.followee_list)) > -1) {
            this.followee_list[p].IS_FOLLOWEE = 1;
          }
          if(this.follower_list && (p = this.find(id, this.follower_list)) > -1) {
            this.follower_list[p].IS_FOLLOWEE = 1;
          }
          this.fireEvent('add_followee_success', id);
          (callback || $empty)(true);
        } else {
          this.error(response.RESPONSE.MSG, 'Błąd dodawanie do śledzonych');
        }
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd dodawania do śledzonych'])
    });
    
    new Popup({
      title: 'Śledzik',
      content: this.options.messages.add_followee,
      content_safe_mode: false,
      buttons: [{ label: 'Tak', onClick: r.send.bind(r) }, { label: 'Nie', onClick: function() { (callback || $empty)(false);} }]
    });
  },
  
  remove_followee: function(id, callback)
  {
    var r = new Request.FORM({
      url: '/sledzik/followee/remove/js',
      data: { user_id: id },
      ticket: this.options.tickets.remove_followee,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          if(this.promoted_list && (p = this.find(id, this.promoted_list)) > -1) {
            this.promoted_list[p].IS_FOLLOWEE = 0;
          }
          if(this.followee_list && (p = this.find(id, this.followee_list)) > -1) {
            this.followee_list[p].IS_FOLLOWEE = 0;
          }
          if(this.follower_list && (p = this.find(id, this.follower_list)) > -1) {
            this.follower_list[p].IS_FOLLOWEE = 0;
            if(this.options.follower.uid == this.options.uid) {
              this.follower_list.splice(p,1);
            }
            this.fireEvent('changed_follower_list');
          }
          this.fireEvent('remove_followee_success', id);
          (callback || $empty)();
        } else {
          this.error(response.RESPONSE.MSG, 'Błąd usuwania osoby śledzonej');
        }
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd usówania osoby śledzonej'])
    });
    
    new Popup({
      title: 'Śledzik',
      content: this.options.messages.remove_followee,
      content_safe_mode: false,
      buttons: [{ label: 'Tak', onClick: r.send.bind(r) }, { label: 'Nie' }]
    });
    
    return false;
  },
  
  get_follower: function(callback)
  {
    if(this.follower_list == null) {
      new Request.NK({
        url: '/sledzik/follower/ajax/' + this.options.follower.flags + '/' + this.options.follower.uid + '/' + this.options.follower.version,
        method: 'get',
        onSuccess: function(response) {
          this.follower_list = this.parse_list(response.DATA, this.options.promoted.fields);
          callback(this.follower_list);
        }.bind(this)
      }).send();
    } else {
      (callback || $empty)(this.follower_list);
    }
  },
  
  get_followee: function(callback)
  {
    if(this.followee_list == null) {
      new Request.NK({
        url: '/sledzik/followee/ajax/' + this.options.followee.flags + '/' + this.options.followee.uid + '/' + this.options.followee.version,
        method: 'get',
        onSuccess: function(response) {
          this.followee_list = this.parse_list(response.DATA, this.options.promoted.fields);
          (callback || $empty)(this.followee_list);
        }.bind(this)
      }).send();
    } else {
      (callback || $empty)(this.followee_list);
    }
  },
  
  /***************************** Obsługa promowanych *****************************/
  
  get_promoted: function(callback)
  {
    if(this.promoted_list == null) {
      new Request.NK({
        url: '/sledzik/promoted/ajax/' + this.options.promoted.flags + '/' + this.options.promoted.version,
        method: 'get',
        onSuccess: function(response) {
          this.promoted_list = this.parse_list(response.DATA, this.options.promoted.fields);
          callback(this.promoted_list);
        }.bind(this)
      }).send();
    } else {
      callback(this.promoted_list);
    }
  },
  
  get_promoted_to_promote: function(callback, ignored_ids)
  {
    var ignored_ids = ignored_ids || [];
    if(this.promoted_list == null) {
      this.get_promoted(this.get_promoted_to_promote.bind(this, [callback, ignored_ids]));
    } else {
      if(this.promoted_list_to_promote == null) {
        this.promoted_list_to_promote = this.promoted_list.filter(function(item) { return item.IS_FOLLOWEE == 0 && item.PROMOTED_IS_IGNORED == 0;});
        this.suffle(this.promoted_list_to_promote);
      }
      (callback ||$empty)(this.promoted_list_to_promote.filter(function(item) { return ignored_ids.indexOf(item.UID) == -1; }));
    }
  },

  add_promoted_ignored: function(uid, callback)
  {
    var r = new Request.FORM({
      url: '/sledzik/promoted/add_ignored/js',
      data: { promoted_id: uid },
      ticket: this.options.tickets.add_ignored ,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          var p = this.find(uid, this.promoted_list);
          if(p >- 1) {
            this.promoted_list[p].PROMOTED_IS_IGNORED = 1;
            try {
              this.promoted_list_to_promote.splice(this.find(uid, this.promoted_list_to_promote), 1);
            } catch(e) { }
          }
          this.fireEvent('add_ignored_success', uid);
          (callback || $empty)(true);
        } else {
          $log('Błąd');
        }
      }.bind(this),
      
      onFailure: this.error.bind(this, [PopupConfig.ajax_error, 'Błąd usówania osoby z promowanych']) 
    });
    
    new Popup({
      title: 'Śledzik',
      content: 'Nie pokazuj więcej w polecanych osobach',
      buttons: [{label: 'Tak', onClick: r.send.bind(r) },{label: 'Nie', onClick: function() { (callback || $empty)(false); } }]
    });
  },
  
  /******************************************************************************/
  
  find: function(uid, list)
  {
    if(!list) {
      return -1;
    }
    
    for(var i=0, l=list.length; i<l; i++) {
      if(list[i].UID == uid) {
        return i;
      }
    }
    return -1;
  },
  
  suffle: function(o)
  {
    for(var j, x, i=o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  },
  
  parse_list: function(data, fields)
  {
    var list = new Array();
    
    for(var i=0; i<data.UID.length; i++) {
      list[i] = {};
    }
    for(var flag in fields) {
      if(data[flag]){
        for(var t=data[flag],  i=t.length; i--;){
          list[i][flag]=t[i];
        }
      }
    }
    return list;
  }
  
}))(nk_options.sledzik.observer);

$(window).addEvent('bodystart_nk', function() {
  SledzikObserver.init();
});
