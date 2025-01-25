var SledzikController = new Class({
  Implements: [Options],
  
  list: {
  
  },
  options: { 
    max_length: 250,
    add_timeout: 5000
  },
  
  z_index_top: 100,
  z_index_bottom: 99,
  
  form: null,
  container: null,
  add_shout_source: 0,
  add_shout_disabled: false,
  
  init_controller: function(options)
  {    
    if(Browser.Engine.webkit) {
      this.auto_height = function(element, max) {
        element.setStyle('height', Math.min(element.scrollHeight - element.getStyle('padding-top').toInt() - element.getStyle('padding-bottom').toInt(),max));    
      };
    } else {
      this.auto_height = function(element, max) {
        element.setStyle('height',Math.min(element.scrollHeight,max));
      };
    }
    
    $(document.body).addEvent('click', function(e) {
      for(var uid in this.list) {
        for(var id in this.list[uid]) {
          if(e.target != this.list[uid][id].menu.show) {
            this.list[uid][id].show_menu(false);
          }
        }
      }
    }.bind(this));
    
    ClientStorage.wait_storage(function() {
      this.cache = ClientStorage.get_storage();
    }.bind(this));
  },
  
  init_form_events: function()
  {
    this.form.addEvent('submit', function(e) {
      var text = this.form.textarea.value.trim();
      
      if(text.length && !this.form.send.hasClass('disabled')) {          
        this.form.send.addClass('disabled');
        SledzikObserver.add_shout(text, this.form.options.checkbox.get('checked'), this.add_shout_source);
      }
    }.bindWithStopEvent(this));

    this.form.textarea.addEvents({
      'click': function() {            
        if(!this.form.textarea.hasClass('open')) {
          this.form.textarea.addClass('open').set('value','');
          if(this.add_shout_disabled == false) {
            this.form.send.removeClass('disabled');
          }            
          try {
            this.form.getElement('div.controll_box').addClass('open');
          } catch(e) {}
        }
      }.bind(this),
      
      'change': function(e) {                        
        if(e.target.value.length >= this.options.max_length) {
          e.target.set('value', e.target.value.substring(0,this.options.max_length));
        }
        
        this.auto_height(e.target, 75);
        this.form.options.counter.innerHTML = (this.options.max_length - parseInt(e.target.value.length));
      }.bind(this),
      
      'keyup': function(e) {
        this.form.textarea.fireEvent('change', e);
      }.bind(this),
      
      'keypress': function(e) {
        if(e.key === 'enter') {
          this.form.fireEvent('submit',e);
        }
        if(this.form.textarea.value.length >= this.options.max_length && e.code > 34 && e.code < 47) {
          return true;
        }
        if(this.form.textarea.value.length >= this.options.max_length && e.code > 8 && e.code < 63200) {
          return false;
        }
        
        this.form.textarea.fireEvent('change', e);
      }.bind(this)
    });
    this.form.textarea.set('value', 'Napisz co teraz robisz, o czym myślisz lub prześlij ciekawy link');
    
    if(this.cache) {
      this.form.options.checkbox.addEvent('change',function(e) { this.cache.set('sledzik_only_for_friends', e.target.checked, null, true); }.bind(this));
    }
  },

  init_observer_events: function()
  {
    SledzikObserver.addEvents({      
      
      add_shout_success: function(response) {
        this.add_shout_action(response);
        if($type(this.form)) {
          this.form.textarea.set('value','').morph({ height: 15 });
          this.form.options.counter.set('text',this.options.max_length);
        }
      }.bind(this),
      
      add_shout_disabled: function(timeout) {
        if($type(this.form) == false) {
          return false;
        }
        this.form.send.addClass('disabled');
        this.add_shout_disabled = true;
        (function() {
          this.add_shout_disabled = false;
          if(this.form.textarea.hasClass('open')) {
            this.form.send.removeClass('disabled');
          }
        }).delay(timeout, this);
      }.bind(this),
      
      add_comment_success: function(id, uid, content, count) {
        if(this.list[uid] && this.list[uid][id]) {
          SledzikObserver.parse(this.list[uid][id].change_comments(new ShoutComments(content), count).get_to_parse());
        }
      }.bind(this),
      
      add_comment_disabled: function(timeout) {
        for(var uid in this.list) {
          for(var id in this.list[uid]) {
            this.list[uid][id].disable_add_comment(timeout);
          }
        }
      }.bind(this),
      
      remove_comment_success: function(id, uid, content, count) {
        if(this.list[uid] && this.list[uid][id]) {
          SledzikObserver.parse(this.list[uid][id].change_comments(new ShoutComments(content), count).get_to_parse());
        }
      }.bind(this),
      
      add_shout_star_success: function(id, uid) {
        if(this.list[uid] && this.list[uid][id]) {
          this.list[uid][id].disable_star().increment_number_stars();
        }
      }.bind(this),
      
      remove_followee_success: function(uid) {
        if(this.list[uid]) {
          for(var id in this.list[uid]) {
            this.list[uid][id].menu.items.dont_followee.getParent('li').destroy();
          }
        }
      }.bind(this),
      
      loading: this.loading.bind(this),
      
      hidden_shout_success: this.remove_shout.bind(this),
      remove_shout_success: this.remove_shout.bind(this)
    });
  },
  
  add_shout: function(data, inject_type, parse)
  {
    var shout = new Shout(data).addEvent('comment_form_show', this.comment_form_show.bind(this));
    
    if(!this.list[shout.s_uid]) {
      this.list[shout.s_uid] = {};
    }
    if(this.list[shout.s_uid] && this.list[shout.s_id]) {
      shout.destroy();
      return null;
    }
    
    this.list[shout.s_uid][shout.s_id] = shout;
    
    switch(inject_type) {
      case 'static_top':
        shout.setStyles({'z-index': this.z_index_top++ , 'overflow': ''}).injectTop(this.container);
        break;
      case 'static_bottom':
        shout.setStyles({'z-index': this.z_index_bottom-- , 'overflow': ''}).inject(this.container);
        break;
      case 'animation':
        shout.setStyle('z-index', this.z_index_top++).fx_inject(this.container, {
          where: 'top',
          duration: 400,
          onComplete: function() {
            shout.setStyle('overflow','');
            this.loading(false);
          }.bind(this)
        });
        break;
      default:
        shout.setStyle('z-index', this.z_index_top++);
    }
    
    if(parse) {
      SledzikObserver.parse(shout.get_to_parse());
    }
    
    return shout;
  },
  
  add_shouts: function(shouts_data, inject_type)
  {
    var shouts = [];
    var parse_contents = [];
    
    for(var i=0, l=shouts_data.length; i<l; i++) {
      var shout = this.add_shout(shouts_data[i], inject_type || 'none', false);
      if(shout) {
        shouts.push(shout);
        parse_contents = parse_contents.concat(shout.get_to_parse());
      }
    }
    
    SledzikObserver.parse(parse_contents);
    
    return shouts;
  },

  add_shout_action: function(response)
  {
    this.add_shout(response.RESPONSE.SHOUT.content, 'animation', true);
  },

  remove_shout: function(id, uid)
  {
    if(this.list[uid] && this.list[uid][id]) {
      this.list[uid][id].fx_dispose({ onSuccess: function() { delete this.list[uid][id]; }.bind(this)});
    }
  },
  
  comment_form_show: function(shout)
  {
    for(var uid in this.list) {
      for(var id in this.list[uid]) {
        if(this.list[uid][id] != shout && this.list[uid][id].comment.form.contener.hasClass('open') && this.list[uid][id].comment.form.input.value.length == 0) {
          this.list[uid][id].hidden_comment_form();
        }
      }
    }
  }, 
  
  loading: function(visible, timeout)
  {
    if(this.form && this.form.loading) {
      if(visible) {
        this.form.loading.setStyle('display', 'inline');
      } else {
        if(timeout) {
          this.form.loading.setStyle.delay(timeout, this.form.loading, ['display', 'none']);
        } else {
          this.form.loading.setStyle('display', 'none');
        }
      }
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
