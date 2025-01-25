var AreFriendsClass = new Class({
  friendsList : null,
  downloadFriends : function() {
    var that = this;
    var FriendsListSack = new sack('/friends_list/' + nk_options.are_friends.self_uid  + '/1/' + nk_options.are_friends.own_friends_list_version);
    FriendsListSack.onCompletion = function ()
    { 
      var response = JSON.decode(this.response);
      var uids = response.UID;
      that.friendsList = new Hash();
      $each(uids, function(uid) {
        that.friendsList.set(uid, true);
      });
      that.onReady();
    }
    FriendsListSack.method = "GET";
    FriendsListSack.runAJAX();
  },
  onReady : function() {
  },
  isFriend : function(uid) {
   return this.friendsList.has(uid);
  }
  
});

var IsKnownClass = new Class({
  Extends : AreFriendsClass,
  onReady : function() {
    var that = this;
    $each(this.is_known_items, function(el){
      var classes = el.get('class');
      var re = new RegExp('uid_([0-9]+)' ,'g');
      var id = re.exec(classes)[1];
      if(that.isFriend(id.toInt())) {
        el.removeClass('is_known');
      }
    });
    $each(this.is_unknown_items, function(el){
      var classes = el.get('class');
      var re = new RegExp('uid_([0-9]+)' ,'g');
      var id = re.exec(classes)[1];
      if(!that.isFriend(id.toInt())) {
        el.removeClass('is_unknown');
      } else {
        if(el.getParent('ul').getElements('li').length < 2) {
          el.getParent('div.avatar_bar').getElement('div.avatar_arrow').addClass('disabled').removeEvents('click');
        }
        el.destroy();
      }
    });    
  },
  displayPlaceholders : function() {
    this.is_known_items = $$('.is_known');
    this.is_unknown_items = $$('.is_unknown');
    if(this.is_known_items.length || this.is_unknown_items.length) {
      this.downloadFriends();
    }
  }
});

var IsKnown  = new IsKnownClass();

window.addEvent('domready_nk', function() {
  IsKnown.displayPlaceholders();
});
