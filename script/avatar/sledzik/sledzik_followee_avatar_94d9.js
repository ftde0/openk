var SledzikFolloweeAvatar = new Class({
  Extends: GenericAvatar,
  Implements: SledzikAvatarInterface,
   
  type: 0,
  
  prepare_data : function(e)
  {
    return  {
      id : e.user_info.UID,
      name : e.user_info.FIRST_NAME + ' ' + e.user_info.LAST_NAME,
      city : e.user_info.CITY ,
      photo_uri : e.user_info.AVATAR,
      are_friends : e.user_info.IS_FRIEND,
      friends_count : e.user_info.FRIENDS_COUNT,
      artificiality : e.user_info.ARTIFICIALITY,
      current_filter : e.user_info.current_filter,
      is_friend: e.user_info.IS_FRIEND,
      is_followee: e.user_info.IS_FOLLOWEE,
      is_official: e.user_info.IS_OFFICIAL || false,
      can_followee: e.user_info.CAN_FOLLOWEE,
      position: e.id,
      action: e.action
    };
  },
  
  render: function(raw_data)
  {
    var avatar = this.parent(raw_data);        
    var div = new Element('div', {        
      'class' : 'avatar_sledzik',
      'events' : {
        'click' : function(e) { e.stopPropagation(); }
      }
    }).inject(avatar);
      
    if(this.user_data.is_followee || this.user_data.is_friend || (!this.user_data.is_followee && this.user_data.can_followee)) {
      avatar.form = this.get_followee_form(this.type).inject(div);
    } else {
      div.grab(new Element('div',{'class': 'follow_inactive', 'html': '<span>Śledź</span>', 'title': 'Nie możesz śledzić tej osoby ze względu na jej ustawienia prywatności'}));
    }
    
    return avatar;
  }
});
