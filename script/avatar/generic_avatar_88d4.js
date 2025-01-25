/**
 * @author Milosz Kordecki
 */
var GenericAvatar =  new Class({
  
  avatar_class : Avatar,
  
  options : new Array(),
  
  add_option : function(option) {
    if(option.is_visible()) {
      this.options.push(option);
    }
  },
  
  prepare_data : function(raw_data) {
    var data = {
      id: raw_data.id,
      name: raw_data.name,
      city: raw_data.city,
      photo_uri: raw_data.photo_uri,
      friends_count: raw_data.friends_count,
      artificiality: raw_data.artificiality
    }
    return data;  
  },
  
  load_options : function() {
    this.options = new Array();
    this.add_option(new AvatarOptionGallery(this.user_data.id));
    this.add_option(new AvatarOptionSendGift(this.user_data.id));
    this.add_option(new AvatarOptionAddToFriends(this.user_data));
    this.add_option(new AvatarOptionCommonFriends(this.user_data));
    this.add_option(new AvatarOptionDzienMatkiSendCard(this.user_data.id));
    this.add_option(new AvatarOptionEurogabki(this.user_data.id)); 
    this.add_option(new AvatarOptionSendWielkanoc2010Card(this.user_data.id));
    this.add_option(new AvatarOptionSendWielkanoc2010Water(this.user_data.id));
  },
  
  render : function(raw_data) {
    this.user_data = this.prepare_data(raw_data);
    this.load_options();
    var avatar = new Element('div',{
      'class' : 'avatar',
      'events': {
        'click': function(e) {
          e.stopPropagation();
        }
      }
    });
    avatar.grab(this.get_content());  
    if(nk_options.name_day && nk_options.name_day.enabled == true) {
      avatar.grab(this.get_name_day_button());
    }
    avatar.setStyle('display', 'block');
    return avatar;
  },
  
  get_content : function() {
    var content = new Element('div',{
      'class': 'avatar_content'
    });
    content.grab(this.get_photo());
    content.grab(this.get_user_info());
    content.grab(this.get_bar());
    return content;
  },
  
  get_photo : function() {
    var photo = new Element('div', {
      'class': 'avatar_new_photo'
    });
    
    var photo_middle = new Element('div',{
      'class' : 'avatar_middle'
    });
    
    var photo_inner = new Element('div', {
      'class' : 'avatar_inner'
    });
    
    var photo_href = new Element('a',{   
      'href'   : '/profile/' + this.user_data.id,
      'title'  : 'Przejdź do profilu'
    });
    
    photo_href.grab( new Element('img' ,{
      'alt'   : 'Pokaż profil',
      'class' : this.user_data.photo_uri ? '' : 'brak_zdjecia',
      'src'   : this.user_data.photo_uri || getStaticUri('/img/avatar/brakzdjecia')
    }));
    
    var artificial = this.get_artificial();
    if(artificial) {
      photo_href.grab(artificial);
    }
    photo_inner.grab(photo_href);
    photo_middle.grab(photo_inner);
    photo.grab(photo_middle);
    return photo; 
  },

  get_artificial : function() {
    this.user_data.artificiality = parseInt(this.user_data.artificiality); 
    if(!this.user_data.artificiality) {
      return
    }
    if(this.user_data.artificiality == 3) {
      return new Element('span', {
        'class' : 'official_tag'
      });
    } else if(this.user_data.artificiality == 2) {
      return new Element('span', {
        'class' : 'sponsored_tag'
      });
    } else {
      return new Element('img', {
        'alt' : 'Profil fikcyjny',
        'class' : 'av_kontofikcyjne',
        'src' : getStaticUri('/img/av_kontofikcyjne.gif')
      });
    }
  },
  
  get_user_info : function() {
    var _this = this;
    var info = new Element('div', {
      'class' : 'avatar_info'
    });
    info.addEvent('mouseover', function(e){ 
      _this.avatar_class.add_hover(this); 
    }); 
    info.addEvent('mouseleave', function(e){
      clearTimeout(this.t); 
      this.has_hover = false;
    });
    var user_info = new Element('div', {
      'class' : 'avatar_user_info'
    });
    user_info.grab(this.get_name());
    user_info.grab(this.get_city());
    info.grab(user_info);
    return info;
  },
  
  get_name : function() {
    var name = new Element('a', {
      'class' : 'avatar_user_name',
      'html'  : nk.misc.print_with_wbr(this.user_data.name,12),
      'title' : 'Przejdź do profilu',
      'href'  : '/profile/' + this.user_data.id
    });
    return name;
  },
  
  get_city : function() {
    var city = new Element('p', {
      'class' : 'avatar_user_city',
      'html'  : nk.misc.print_with_wbr(this.user_data.city,12) 
    });
    return city;
  },
  
  get_bar : function() {
    var bar = new Element('div', {
      'class' : 'avatar_bar'
    });
    bar.grab(this.get_mail_button());
    bar.grab(this.get_friends_button());
    bar.grab(this.get_options_button());
    bar.grab(this.get_options_window());
    return bar;
  },
  
  get_name_day_button : function() {
    var name_day_button = new Element('div', {
      'class' : 'avatar_name_day'
    });
    var link = new Element('a', {
      'title' : 'Podaruj prezent',
      'href'  : '/gifts/send/' + this.user_data.id
    });
    link.grab(new Element('span', {
      'class' : 'hidden',
      'html' : 'Podaruj prezent'
    }));
    name_day_button.grab(link);
    return name_day_button;
  },
  
  get_mail_button : function() {
    var mail_button = new Element('a', {
      'class' : 'avatar_mail',
      'title' : 'Wyślij wiadomość',
      'href'  : '/poczta/compose/' + this.user_data.id
    });
    mail_button.grab(new Element('img', {
      'alt' : 'Napisz wiadomość',
      'src' : getStaticUri('/img/avatar/avatar_mail')
    }));
    return mail_button;
  },
  
  get_friends_button : function() {
    var trimmed_friends_count = ( parseInt(this.user_data.friends_count) > this.avatar_class.max_friends_count ) ? this.avatar_class.max_friends_count+'+' :  parseInt(this.user_data.friends_count) ;
    var friends_button =  new Element('a', {
      'class' : 'avatar_friends',
      'href'  : '/friends/' + this.user_data.id,
      'title' : 'Pokaż listę znajomych'
    });
    friends_button.grab(new Element('img', {
      'src' : getStaticUri('/img/icon/ico_friends')
    }));
    friends_button.grab(new Element('span', {
      'html' : trimmed_friends_count
    }));
    return friends_button;
  },
  
  get_options_button : function() {
    var _this = this;
    var options_button = new Element('div', {
      'class' : 'avatar_arrow' + (this.options.length == 0 ? ' disabled' : '')
    });
    if(this.options.length) {
      options_button.addEvent('click', function(event){
        _this.avatar_class.toggle_options(this)
      });
      options_button.addEvent('click', function(event){
        _this.avatar_class.stop_propagation(event);
      });
    }
    options_button.grab(new Element('img', {    
      'src' : getStaticUri('/img/avatar/avatar_arrow'),
      'alt' : 'Rozwiń'
    }))
    return options_button;
  },
  
  get_options_window: function(){
    var _this = this;
    var options_window = new Element('div', {
      'class': 'avatar_options'
    });
    
    var arrow_button = new Element('span',{
      'html': '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
      'class': 'avatar_close_arrow'
    }); 
    
    options_window.grab(arrow_button);
    
    arrow_button.addEvent('click', function(event){
      _this.avatar_class.hide_all_options()
    });

    options_window.grab(this.get_options_list());
    options_window.setStyle('display','none');
    options_window.addEvent('click', function(event){
      _this.avatar_class.stop_propagation(event);
    });
    return options_window;
  },
  get_options_list : function() {
    var options_list = new Element('ul', {
      'class': 'avatar_options_list'
    });
    $each(this.options, function(item) {
      options_list.grab(item.get_content());
    });
    return options_list;
  }
   
});
