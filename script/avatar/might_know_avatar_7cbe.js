MightKnowAvatar = new Class({
  Extends : GenericAvatar,
    
  prepare_data : function(e) {
    var user_data =  {
      id : e.UID,
      name : e.FIRST_NAME + ' ' + e.LAST_NAME,
      city : e.CITY,
      photo_uri : e.AVATAR,
      are_friends : e.is_known,
      friends_count : e.FRIENDS_COUNT,
      current_filter : e.current_filter,
      artificiality : e.ARTIFICIALITY,
      rank: e.RANK,
      source: e.SOURCE,
      link: e.LINK
    }
    return user_data;
  },
  
  render : function(raw_data) {
    var avatar = this.parent(raw_data);
                
        
    var avatar_box = new Element('div',{'class': 'might_know_avatar', 'id':'might_know_avatar_'+this.user_data.id});

    var top = this.add_top();
    top.inject(avatar,'top');
        
    avatar.grab(this.add_bottom());
        
    avatar_box.grab(avatar);
        
    return avatar_box;
  },
  
  add_top : function() {
    var uid = this.user_data.id;
    var unwanted = new Element(
      'div',
      {
        'class': 'unwanted_button', 
        'title': 'Usuń propozycję', 
        'html': 'X'
      }
    );
    unwanted.addEvent('click', function(event){MightKnow.set_as_unwanted(uid);});
        
    var rank = new Element('div',{'class': 'might_know_reason'});
    var href;
    var html;
    switch (this.user_data.source) {
      case 1:
        href='/friends/'+this.user_data.id+'#common';
        html='Wspólni znajomi ('+this.user_data.rank+') ';
      break;
      default: 
        href='/school/'+this.user_data.link;
        html='Z Twojej klasy ';
      break;
    }
    var link = new Element(
      'a',
      {
        'href': href,
        'html': html
      }
    );
    rank.grab(link);
    rank.grab(unwanted);
    return rank;
  },
  
  add_bottom : function() {
    var uid = this.user_data.id;
    var add_to_friends = new Element(
      'div',
      {
        'id':'might_know_invite_button_'+uid, 
        'class': 'add_to_friends_button'
      }
    );
    
    var add_to_friends_button = new Element(
      'div',
      {
        'title': 'Zaproś do znajomych',
        'text': 'Znajomy'
      }
    );
    add_to_friends_button.addEvent('click',function(event){ MightKnow.invite_friend(uid);});
    add_to_friends.grab(add_to_friends_button);
    
    return add_to_friends;
  }
});
