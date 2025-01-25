var SledzikFriendsBox = new Class({
  initialize: function() 
  {
    SledzikObserver.addEvents({      
      add_followee_success: function() {
        this.follower_count.set('text', this.follower_count.get('text').toInt()+1);
      }.bind(this),
      
      remove_followee_success: function() {
        this.follower_count.set('text', this.follower_count.get('text').toInt()-1);
      }.bind(this)
    });
  },
  
  catch_box: function(element)
  {
    var counters = element.getElements('span.counter');
    this.friends_count = counters[0];
    this.follower_count = counters[1];
    this.followee_count = counters[2];
  },
    
  create_box: function()
  {
    this.box = new Element('div', {'class': 'box box2'});
    
    this.box.header = new Element('div', {
      'class': 'box_header',
      'html': '<div class="raquo">»</div><a href="/friends">Osoby</a>'
    });    
    this.box.content = new Element('div', {
      'class': 'box_content'
    });
    this.box.content.body = new Element('ul', {
      'class': 'sledzik_followers',
      'html': '<li class="friends"><a href="/friends"><span class="icon">&nbsp;</span>Znajomi - <span class="counter">13</span></a></li><li class="follow"><a href="/sledzik/follower"><span class="icon">&nbsp;</span>Śledzę - <span class="counter">22</span></a></li><li class="followers"><a href="/sledzik/followee"><span class="icon">&nbsp;</span>Śledzą Cię - <span class="counter">14</span></a></li>'
    });
    
    var counters = this.box.content.body.getElements('span.counter');
    this.friends_count = counters[0].set('text', SledzikObserver.options.counters.friends);
    this.follower_count = counters[1].set('text', SledzikObserver.options.counters.follower);
    this.followee_count = counters[2].set('text', SledzikObserver.options.counters.followee);
    
    this.box.adopt(this.box.header, this.box.content.grab(this.box.content.body));
  }
});

var SledzikStarBox = new Class({
    
  load_box: function()
  {
    new Request.NK({
      url: '/sledzik/last_star',
      method: 'get',
      onSuccess: function(response) {
        this.box.content.body.set('html', response.content).removeClass('loading');
      }.bind(this)
    }).send();
  },

  create_box: function()
  {
    this.box = new Element('div', {'class': 'box box2 sledzik_celebrities_stars last_stars_box'});
    this.box.header = new Element('div', {
      'class': 'box_header',
      'html': '<div class="raquo">»</div>Ostatnio dodane gwiazdki'
    });
    this.box.content = new Element('div', {
      'class': 'box_content'
    });
    this.box.content.body = new Element('ul', {
      'class': 'person_list loading'
    });
    this.box.adopt(this.box.header, this.box.content.adopt(this.box.content.body));
  }
});

var SledzikPromotedBox = new Class({

  slot_id: 0,
  promoted: {},
  promoted_uids: [],
  
  renderer : new SledzikPromotedBoxSledzikAvatar(),
  
  initialize: function() 
  {    
    SledzikObserver.addEvents({
      add_ignored_success: this.update_box.bind(this),
      add_followee_success: this.update_box.bind(this)
    });
    
    this.is_opened = false;
  },
 
  load_box: function()
  {    
    SledzikObserver.get_promoted_to_promote(function(list) {
      this.box.content.body.removeClass('loading');      
      if(list.length) {
        for(var i=0, l=Math.min(list.length, 3); i<l; i++) {
          var avatar = this.renderer.render({user_info: list[i]});
              avatar.slot_id = this.slot_id++;
          this.promoted[list[i].UID] = avatar;          
          this.promoted_uids.push(list[i].UID);
          this.box.content.body.grab(avatar);
        }
      } else {
        this.box.content.body.grab(new Element('li', {'class': 'no_propositions', 'text': 'Śledzisz już wszystkie promowane osoby'}));
      }
    }.bind(this), []);
  },
  
  catch_box: function(element)
  {
    this.is_opened = true;
    
    this.box = element;
    this.box.content = {};
    this.box.content.body = this.box.getElement('ul.person_list');
    this.box.content.body.getElements('li').each(this.catch_avatar.bind(this)); 
  },
  
  catch_avatar: function(avatar)
  {
    avatar.slot_id = this.slot_id++;
    
    var f = avatar.getElement('form.add_followee');    
    if(f == null) {
      return;
    }
    var i = avatar.getElement('form.add_promoted_ignored');
    var uid = f.getElement('input[name=user_id]').get('value').toInt();
    var type = f.getElement('input[name=type]').get('value').toInt();

    this.promoted[uid] = avatar;
    this.promoted_uids.push(uid);
    
    f.getElement('button').set('onclick','');
    
    f.addEvent('submit', function(e, uid) {
      if(e.target.loading) {
        return;
      }
      e.target.loading = true;
      SledzikObserver.add_followee(uid, type, function(status) { if(status == false) e.target.loading = false;});
    }.bindWithStopEvent(f, uid));    
    
    i.addEvent('submit', function(e, uid) {
      if(e.target.loading) {
        return;
      }
      e.target.loading = true;
      SledzikObserver.add_promoted_ignored(uid, function(status) { if(status == false) e.target.loading = false;});
    }.bindWithStopEvent(i, uid));
  },
    
  update_box: function(uid)
  {   
    if(!this.promoted[uid]) {
      return ;
    }

    var slot = this.promoted[uid].slot_id;
    var params = nk_options.sledzik.promoted_box.categories[slot].split('_');
    var type = params[0].toInt();
    var category = params[1].toInt();
    
    var filter_fn = function(item) { return item.TYPE == type && item.CATEGORY == category; };
    
    SledzikObserver.get_promoted_to_promote(function(list) {            
      if(list.length) {
        var l = list.filter(filter_fn);
        var p = l.length ? l[0] : list[0];
        var promoted = this.render({user_info: p}, slot);            
        
        if(this.is_opened) {
          this.promoted[uid].fx_replaces(promoted, {
            width: this.get_avatar_width(),
            onComplete: function(element) {              
              this.promoted[uid].destroy();
              this.promoted[p.UID] = promoted;
              delete this.promoted[uid];
            }.bind(this)
          });
        } else {
          promoted.replaces(this.promoted[uid]);
          this.promoted[uid].destroy();
          this.promoted[p.UID] = promoted;
          delete this.promoted[uid]; 
        }
        
        this.promoted_uids.push(p.UID);
      } else {
        this.update_on_empty_list(uid);
      }
    }.bind(this), this.promoted_uids);
  },
  
  get_avatar_width: function()
  {
    return null;
  },
  
  render: function(data, slot)
  {
    var promoted = this.renderer.render(data);
        promoted.slot_id = slot;        
    return promoted;
  },
  
  update_on_empty_list: function(uid)
  {
    if(this.box.content.body.getElements('li').length > 1) {
      this.promoted[uid].fx_dispose({ 
        onComplete: function() {
          this.promoted[uid].destroy();
          delete this.promoted[uid];
        }.bind(this)
      });
    } else {
      var info = new Element('li',{'class': 'no_propositions', 'text': 'Śledzisz już wszystkie promowane osoby'});        
      if(this.is_opened) {
        this.promoted[uid].fx_replaces(info, { 
          onComplete: function() {
            this.promoted[uid].destroy();
            delete this.promoted[uid];
          }.bind(this)
        });
      } else {
        info.replaces(this.promoted[uid]);
        this.promoted[uid].destroy();          
        delete this.promoted[uid]; 
      }
    }
  },
  
  create_box: function()
  {
    this.box = new Element('div', {'class': 'box box2 sledzik_celebrities_stars celebrites_box hide'});
    
    this.box.header = new Element('div', {
      'class': 'box_header',
      'html': '<div class="raquo">&raquo;</div><a href="/sledzik/promoted">Polecamy</a>'
    });    
    this.box.content = new Element('div', {
      'class': 'box_content'
    });
    this.box.content.body = new Element('ul', {
      'class': 'person_list loading'
    });
    this.box.content.footer = new Element('div', {
      'class': 'coolbox_bottom',
      'html': '<a href="/sledzik/promoted"><span class="raquo">»</span>zobacz wszystkie</a>'
    });
    
    this.box.adopt(this.box.header, this.box.content.adopt(this.box.content.body, this.box.content.footer));
  }
});

var SledzikPromotedSlot = new Class({
  Extends: SledzikPromotedBox,
  
  renderer : new SledzikPromotedBoxMainAvatar(),
  
  catch_box: function(element)
  {
    var type = 0;
    this.is_opened = true;
    
    this.box = element;
    this.box.content = {};
    this.box.content.body = this.box.getElement('ul');
    
    this.box.content.body.getElements('li').each(this.catch_avatar.bind(this)); 
  },
  
  render: function(data, slot)
  {
    var promoted = this.parent(data, slot);
        promoted.set('id', 'promo_slot_' + slot);
    return promoted;
  },
  
  update_on_empty_list: function(uid) {
    if(this.box.content.body.getElements('li.sledzik_shout.nothing').length ==2) {
      this.box.fx_dispose({
        onComplete: function() {
          this.box.destroy();
        }.bind(this)
      });
      return;
    }
    this.promoted[uid].set({
      'class':'sledzik_shout nothing', 
      'html':'<p>Niestety, nie mamy kolejnych propozycji nowych kont</p><p>Szkorzystaj z <a href="/sledzik/promoted" >naszego katalogu kont</a>, może coś Cię zainteresuje</p>'
    });
    delete this.promoted[uid];    
  },
  
  get_avatar_width: function()
  {
    return 182;
  }
});
