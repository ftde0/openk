var Shout = new Class({
  
  s_id: null,
  s_uid: null,
  
  is_my: false,
  is_promoted: false,
  is_comments_opened: false,
  
  /**
   * Konstruktor
   * 
   * @param Element|string {content} - obiekt lub kontent shout-a
   * @return Element - shout
   */
  initialize: function(content)
  {
    if(typeof(content) == 'string') {
      var shout = new Element('div', {
        'html': content,
        'class':'sledzik_shout',
        'styles': {
          'overflow': 'hidden'
        }
      });
    } else {
      var shout = content;
    }    
    
    this.is_my = shout.getElement('div.shout_content').hasClass('my');
    this.is_promoted = shout.getElement('div.header').hasClass('is_promoted');
    
    this.footer = shout.getElement('div.footer div.toggle');
    this.comment = {};
    this.comment.form = shout.getElement('div.add_comment_form form');
    this.comment.form.show = shout.getElement('div.add_comment a');
    this.comment.form.send = shout.getElement('div.add_comment_form form .send_button');
    this.comment.form.input = shout.getElement('textarea.comment_text_input');
    this.comment.form.counter = shout.getElement('span.comment_char_count').setStyle('visibility','visible');
    this.comment.form.contener = shout.getElement('div.add_comment_form');
    this.comment.counter = shout.getElement('span.number_comments');
    this.comment.more_button = shout.getElement('a.show_more_comments');
    
    this.comments = new ShoutComments(shout.getElement('div.comments_block')).addEvents({
      on_comment_abuse: SledzikObserver.abuse.bind(SledzikObserver),
      on_comment_remove: function(id) {
        SledzikObserver.comment_shout_remove(this.s_id, this.s_uid, id);
      }.bind(shout),
      on_comment_change_page: function(page) {
        SledzikObserver.comment_shout_get(this.s_id, this.s_uid, page, function(comment, count) {
          this.change_comments(new ShoutComments(comment), count);
        }.bind(shout));
      }.bind(shout)
    });
    
    var uids = this.comment.form.show.get('href').match(/shout\/([\d]+)\/([\d]+)/);
    this.s_id = uids[2].toInt();
    this.s_uid = uids[1].toInt();
    
    this.menu = shout.getElement('div.shout_menu');    
    this.menu.show = shout.getElement('span.more_options');
    this.menu.items = this.menu.getElement('ul');
    this.menu.items.star = shout.getElement('span.stars a.dodaj');
    this.menu.items.stars_show = shout.getElement('span.stars a.stars_count');
    this.menu.items.abuse = this.menu.getElement('a.report_abuse');
    this.menu.items.remove = this.menu.getElement('form.delete_entry');
    this.menu.items.remove_permanent = this.menu.getElement('a.delete');
    this.menu.items.dont_followee = this.menu.getElement('form.remove_followee');
    this.menu.items.show_link = new Element('li', {
      'class': 'show_link',
      'html': '<span></span>Link do wpisu',
      'events': {
        'click': SledzikObserver.link_shout.bind(SledzikObserver,[this.s_id, this.s_uid])          
      }
    }).inject(this.menu.items);
    
    this.menu.getElements('li').addEvents({
      'mouseover': function(event) { this.addClass('hover'); },
      'mouseout': function(event) { this.removeClass('hover'); }
    });      

    $extend(shout, this);
    
    shout.catch_event();

    return shout;
  },

  /**
   * Fukncja przechwytuje zdarzenia
   */
  catch_event: function()
  {
    var that = this;

    this.addEvents(
      {
        'mouseenter': function(e) {
          this.comment.form.show.getParent().removeClass('dont_show').addClass('hover');
        }.bind(this),
        
        'mouseleave': function(e) {
          if(!this.comment.form.show.getParent().hasClass('form_open')) {
            this.comment.form.show.getParent().addClass('dont_show');
          }
          this.comment.form.show.getParent().removeClass('hover');
        }.bind(this),
        
        'background_click': function(e) {
          if(e.target != this.menu.show) {
            this.show_menu(false);
          }
        }.bind(this)
      }
    );
    
    this.comment.form.show.addEvent('click', function(e) {
      if(this.comment.form.contener.hasClass('open')) {
        this.hidden_comment_form();
      } else {
        this.show_comment_form();
      }
    }.bindWithStopEvent(this));
    
    this.comment.form.show.getParent().addEvent('click', function(e) {
      this.comment.form.show.fireEvent('click', e);
    }.bind(this));
    
    this.comment.form.input.addEvents({
      'keyup': function(event) {
        if(this.value.length > 250) {
          this.value = this.value.substring(0,250);
        }
        that.comment.form.counter.set('text', 250 - parseInt(this.value.length));          
        
        this.setStyle('height',Math.min(75,this.getScrollHeight()));
        var scroll_height = this.getScrollHeight();
        if(this.scroll_height != scroll_height) {
          this.scrollTo(0,scroll_height);
          this.scroll_height = scroll_height;
        }
      },
      
      'keypress': function(event) {
        if(event.key === 'enter') {
          that.comment.form.fireEvent('submit',event);
          return false;
        }
        if(this.value.length>=250 && event.code>34 && event.code < 47) {
          return true;
        }
        if(this.value.length>=250 && event.code>8 && event.code < 63200) {
          return false;
        }
      }
    });    
    
    this.comment.form.addEvent('submit', function(e) {
      var text = this.comment.form.input.get('value').trim();
      if(text.length == 0 || this.comment.form.send.hasClass('disabled')) {
        return ;
      }
      
      SledzikObserver.comment_shout_add(this.s_id, this.s_uid, text, function(content) {
        this.hidden_comment_form();
        this.comment.form.counter.set('text', '250');
        this.comment.form.input.set('value','').morph({ height:14 });
        this.comment.form.send.removeClass.delay(6000, this.comment.form.send, ['disabled']);
        
        if(this.is_comments_opened) {
          this.closed_comments.destroy();
          this.closed_comments = new ShoutComments(content).to_slim();
        }
      }.bind(this));

      this.comment.form.send.addClass('disabled');
    }.bindWithStopEvent(this));
    
    this.comment.more_button.addEvent('click', function(e) {
      if(this.is_comments_opened) {        
        this.is_comments_opened = false;
        this.comment.more_button.removeClass('open');
        this.change_comments(this.closed_comments);
      } else {
        SledzikObserver.comment_shout_get(this.s_id, this.s_uid, 0, function(content, count) {
          this.is_comments_opened = true;
          this.comment.more_button.addClass('open');
          this.closed_comments = new ShoutComments(this.comments.clone());
          this.change_comments(new ShoutComments(content), count);
          
          SledzikObserver.parse(this.get_to_parse());
        }.bind(this));
      }
    }.bindWithStopEvent(this));

    this.menu.show.addEvents({
      'click':  this.toggle_menu.bind(this),
      'mouseout': function(e) { this.removeClass('hover'); },
      'mouseover': function(e) { this.addClass('hover'); }
    });
    
    if(this.menu.items.abuse) {
      this.menu.items.abuse.addEvent('click', function(e) {
        this.toggle_menu();
        SledzikObserver.abuse('/sledzik/shout/' + this.s_uid + '/' + this.s_id + '/abuse', this.menu.items.abuse.get('id').replace(/ticket_/,''));
      }.bindWithStopEvent(this));
    }
    
    if(this.menu.items.remove) {
      this.menu.items.remove.addEvent('submit', function() {
        SledzikObserver.hidden_shout(this.s_id, this.s_uid, this.menu.items.remove.getElement('input[name=auto_form_ticket]').get('value'));
      }.bindWithStopEvent(this));
    }
    
    if(this.menu.items.remove_permanent) {
      this.menu.items.remove_permanent.addEvent('click', function() {
        this.toggle_menu();
        SledzikObserver.remove_shout(this.s_id, this.s_uid);
      }.bindWithStopEvent(this));
    }
    
    if(this.menu.items.dont_followee) {
      this.menu.items.dont_followee.getElement('button').set('onclick','');
      this.menu.items.dont_followee.addEvent('submit', function() {
        SledzikObserver.remove_followee(this.s_uid);
      }.bindWithStopEvent(this));
    }
    
    if(this.menu.items.stars_show) {
      this.menu.items.stars_show.addEvent('click', function(e) {
        SledzikObserver.star_shout_show(this.s_id, this.s_uid);
      }.bindWithStopEvent(this));
    }
    
    if(this.menu.items.star) {
      this.menu.items.star.addEvents({
        'click': function(e) {
          SledzikObserver.star_shout_add(this.s_id, this.s_uid);
        }.bindWithStopEvent(this),
        'mouseout': this.menu.items.stars_show.removeClass.bind(this.menu.items.stars_show, 'hover'),
        'mouseover': this.menu.items.stars_show.addClass.bind(this.menu.items.stars_show,'hover')
      });
    }        
  },
  
  show_comment_form: function()
  {
    this.comment.form.contener.getElement('div').removeClass('hidden');
    this.comment.form.show.getParent().addClass('form_open');
    this.comment.form.contener.addClass('open');
    this.comment.form.input.focus();
    
    this.fireEvent('comment_form_show', this);
  },
  
  hidden_comment_form: function()
  {
    this.comment.form.contener.getElement('div').addClass('hidden');
    this.comment.form.show.getParent().removeClass('form_open');
    if(!this.comment.form.show.getParent().hasClass('hover')) {
      this.comment.form.show.getParent().addClass('dont_show');
    }
    this.comment.form.contener.removeClass('open');
  },
  
  disable_add_comment: function(time)
  {
    this.comment.form.send.addClass('disabled');
    this.comment.form.send.removeClass.delay(time * 1000, this.comment.form.send, ['disabled']);  
  },
  
  change_comments: function(comments, count)
  {
    comments.cloneEvents(this.comments);
        
    if($type(count) == 'number') {
      this.set_number_comments(this.is_promoted ? count : (count - 1));
    }
    if(this.get_number_comments() > 0 ) {
      this.comment.more_button.getParent().removeClass('hidden');
    } else {
      this.comment.more_button.getParent().addClass('hidden');
      this.comment.more_button.removeClass('open');
    }
    if(this.is_comments_opened == false) {
      comments.to_slim();
    }
    
    comments.replaces(this.comments);

    this.comments.destroy();
    this.comments = comments;
    this.footer.getElements('div.paginator').destroy();

    var comments = this.comments.getElements('div.paginator').dispose();

    if(this.is_comments_opened && comments) {
      this.footer.adopt(comments.addClass('right'));
    }
    
    return this.comments;
  },
  
  get_to_parse: function()
  {
    return this.getElements('p.content.parser, span.comment_content.parser');
  },

  /**
   * Funkcja inkrementuje ilość gwiazdek dla danego shout-a
   */
  increment_number_stars: function()
  {
    var star = this.getElement('span.number_stars');
        star.set('text', star.get('text').toInt()+1);

    this.getElement('span.stars a').removeClass('hidden');
    return this;
  },
  
  /**
   * Funkcja ustawia licznik komentarzy
   *
   *  @pram int {count} - liczba komentarzy
   */
  set_number_comments: function(count)
  {
    this.comment.counter.set('text', count);
  },
  
  /**
   * Funkcja pobiera liczbe komantarzy
   * 
   * @return int - liczba komentarzy
   */
  get_number_comments: function()
  {
    return this.comment.counter.get('text').toInt();
  },
  
  show_menu: function(show)
  {
    if(show) {
      this.menu.removeClass('hidden');
    } else {
      this.menu.addClass('hidden');
    }
  },
  
  toggle_menu: function()
  {
    this.menu.toggleClass('hidden');
  },

  disable_star: function()
  {
    new Element('span', {'class': 'dodaj dodana'}).replaces(this.getElement('span.stars a.dodaj'));
    return this;
  }
});

/**
 * Klasa ShoutComments
 */
var ShoutComments = new Class({
  initialize: function(content)
  {
    if(typeof(content) == 'string' ){
      var comments = new Element('div', {
        'html': content,
        'class': 'comments_block'
      });
    } else {
      var comments = content;
    }
    
    if(comments.firstElementChild) {
      comments.addClass('full');
    }                
    
    return $extend(this.catch_events(comments), this);
  },
  
  catch_events: function(comments)
  {
    comments.getElements('a.next, a.page_nr, a.previous').addEvent('click', function(e) {
      comments.fireEvent('on_comment_change_page',[($(e.target).get('href') || $(e.target).getParent().get('href')).match(/page=([\d]+)/).pop().toInt()]);
    }.bindWithStopEvent(this));
    
    comments.getElements('div.comment a.abuse').addEvent('click', function(e) {
      comments.fireEvent('on_comment_abuse', [e.target.get('href'), e.target.id.replace(/ticket_/,'')]);
    }.bindWithStopEvent(this));
    
    comments.getElements('div.content').addEvents({
      'mouseenter': function() { this.addClass('hover'); },
      'mouseleave': function() { this.removeClass('hover'); }
    });
    
    comments.getElements('div.comment form').addEvent('submit', function(e) {
      comments.fireEvent('on_comment_remove', e.target.get('action').match(/comment\/([\d]+)\/remove/).pop().toInt());
    }.bindWithStopEvent(this));
    
    return comments;
  },
  
  to_slim: function()
  {
    var items = this.getElements('div.comment');
    for(var i=1, l=items.length; i<l; i++) {
      items[i].destroy();
    }    
    return this;
  },
  
  get_to_parse: function()
  {
    return this.getElements('span.comment_content.parser');
  }
});
