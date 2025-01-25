var AvatarOption = new Class({
  initialize : function(name,link,class_name,alt,hash) {
    try {
      if (top != window) {
        link = top.nktalk_portal_manager.nk_host + link.substr(1); 
      }
    } catch (e) {
    }
    if(hash == true) {
      link = '/#' + link.substr(1); 
    }
    this.link = link;
    this.name = name;
    this.class_name = class_name ;
    this.alt  = alt ? alt : '';
  },
  get_content : function() {
    var item = new Element('li');
    item.grab(new Element('a', {
      'href' : this.link,
      'html' : this.name,
      'class': this.class_name
    }));
    return item;
  },
  is_visible : function() {
    return true;
  }
});

var AvatarOptionForm = new Class({
  Extends : AvatarOption,
  get_content : function() {
    var item = new Element('li');
    var form = new Element('form', {
      'action' : this.link,
      'method' : 'POST'
    });
    
    var link = new Element('a', {
      'class' : 'ignore',
      'href'  : '#nogo' 
    });
    
    link.grab(new Element('button',{
      'class': this.class_name,
      'type' : 'submit',
      'html' : this.name
    }));
    form.grab(link);
    return item.grab(form);
  }
});

var AvatarOptionAddToFriends = new Class({
  Extends : AvatarOptionForm,
  initialize : function(user_data) {
    this.user_data = user_data;
    this.parent('Dodaj do znajomych', '/invite/' + this.user_data.id , 'add');
  },
  
  get_content : function() {
    var item = new Element('li');
    var form = new Element('form', {
      'action' : this.link,
      'method' : 'POST'
    });
    
    var link = new Element('a', {
      'class' : 'ignore',
      'href'  : '#nogo' 
    });
    
    link.grab(new Element('button',{
      'class': this.class_name,
      'type' : 'submit',
      'html' : this.name
    }));
    
    link.grab(new Element('input', {
      'type'  : 'hidden',
      'name'  : 't',
      'value' : Avatar.t_ticket
    }));
    
    form.grab(link);
    return item.grab(form);  
  },
  
  is_visible : function() {
    return !Avatar.is_anonymous && !this.user_data.are_friends && this.user_data.id != Avatar.uid;
  }
});

var AvatarOptionGallery = new Class({
  Extends : AvatarOption,
  initialize : function(id) {
    this.parent('Galeria', '/profile/' + id + '/gallery', 'gallery');
  },
  
  is_visible: function() {
    return nk_options.session.type != nk.session.SLEDZIK_TYPE;
  }
});

var AvatarOptionCommonFriends = new Class({
  Extends : AvatarOption,
  initialize : function(user_data) {
    this.user_data = user_data;
    this.parent('Wspólni znajomi', '/friends/' + this.user_data.id + '#common', 'common');
  }, 
  is_visible : function() {
    return this.user_data.friends_count >= AVATAR_SETTINGS.min_friends_count &&
           this.user_data.friends_count <= AVATAR_SETTINGS.max_friends_count && 
           this.user_data.id != AVATAR_SETTINGS.user_id;
  }
});

var AvatarOptionRemoveFriend = new Class({
  Extends : AvatarOption,
  initialize : function(user_data) {
    this.user_data = user_data;
    this.parent('Usuń z listy znajomych', '/friends/delete/' + user_data.id , 'remove');
  },
  is_visible : function() {
    return !Avatar.is_anonymous && this.user_data.are_friends && this.user_data.id != Avatar.uid;
  }
});

var AvatarOptionSendGift = new Class({
  Extends : AvatarOption,
  initialize : function(id, hash) {
    this.parent('Wyślij prezent', '/gifts/send/' + id, 'gift', 'Wyślij prezent', hash);
  },
  is_visible: function() {
    return nk_options.session.type != nk.session.SLEDZIK_TYPE;
  }
});

var AvatarOptionDzienMatkiSendCard = new Class({
  Extends : AvatarOption,
  initialize : function(id) {
    this.parent('Wyślij kartkę', '/dzien_matki/' + id + '#kartki', 'dzien_matki_card');
  },
  is_visible : function() {
    return nk_options.avatars.is_dzien_matki_module_visible && nk_options.session.type != nk.session.SLEDZIK_TYPE;
  }
});

var AvatarOptionEurogabki = new Class({ 
  Extends : AvatarOption, 
  initialize : function(id) { 
    if (nk_options.avatars.self_uid != id) {
      this.parent('Podaruj €urogąbki', '/portfel/podaruj/wybor_platnosci?id_osoby=' + id, 'eurogabki_give');
    } else {
      this.parent('Doładuj €urogąbki', '/portfel/waluta', 'eurogabki_prepaid');
    } 
  }, 
  is_visible : function() { 
    return nk_options.avatars.eurogabki_visible && nk_options.session.type != nk.session.SLEDZIK_TYPE; 
  } 
});

var AvatarOptionStartConversation = new Class({
  Extends : AvatarOption,
  initialize : function(has_nktalk,u,hash) {
    this.u = u;
    this.has_nktalk = has_nktalk;
    this.parent('Rozmawiaj', '#nogo', 'talk','Porozmawiaj',hash);
  },
  get_handler : function() {
    return $(window)['nktalk'] || $(window).parent['nktalk'];
  },
  get_content : function() {
    var content = this.parent();
    var that = this;
    content.addEvent('click', function(e) {
      e.stop();
      var nktalk_handler = this.get_handler();
      if($defined(nktalk_handler)) {
        nktalk_handler.events.fireEvent('userSelected', that.u);
      }
    }.bind(this));
    return content;
  },
  is_visible : function() {
    return this.has_nktalk && $defined(this.get_handler());
  }
});

var AvatarOptionSendMessage = new Class({
  Extends : AvatarOption, 
  initialize : function(id,hash) {
    this.parent('Wyślij wiadomość', '/poczta/compose/' + id , 'send_message', 'Wyślij wiadomość',hash);
  }
});

var AvatarOptionArchive = new Class({
  Extends : AvatarOption,
  initialize : function(id,hash) {
    this.parent('Archiwum', '/nktalk/archive/search?user=' + id, 'archive', 'Archiwum' ,hash);
  }
});

var AvatarOptionProfile = new Class({
  Extends : AvatarOption,
  initialize : function(id, hash) {
    this.parent('Profil', '/profile/' + id, 'profile','Profil', hash);
  }
});

var AvatarOptionSendWielkanoc2010Card = new Class({
  Extends : AvatarOption,
  initialize : function(id) {
    this.parent('Wyślij kartkę', '/wielkanoc2010/' + id + '#kartki', 'card');
  },
  is_visible : function() {
    return nk_options.avatars.is_wielkanoc2010_module_visible && nk_options.session.type != nk.session.SLEDZIK_TYPE;
  }
});

var AvatarOptionSendWielkanoc2010Water = new Class({
  Extends : AvatarOption,
  initialize : function(id) {
    this.parent('Oblej wodą', '/wielkanoc2010/' + id + '/choose/oblej#oblej', 'water');
  },
  is_visible : function() {
    return nk_options.avatars.is_wielkanoc2010_module_visible && nk_options.session.type != nk.session.SLEDZIK_TYPE;
  }
});


