var friends_online_title = byId('friends_online_title');
if (typeof friends_online_title != 'undefined' && friends_online_title != null) {
  online_friends_box = byId('friends_online_title').parentNode.parentNode;
  online_friends_box.onmouseover = function(){
    nk.misc.add_class(online_friends_box, 'positionStatic');
  }
  online_friends_box.onmouseout = function(){
    nk.misc.remove_class(online_friends_box, 'positionStatic');
  }
}
