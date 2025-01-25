
var NkTalkWatchedEvents = new Class({
  start_conversation : function(uid){
    var nktalk=$(window).parent.nktalk;     
    nktalk.events.fireEvent("userSelected",nktalk.bar_win.friends_list.get_user_by_uid(uid));
  },
  parse_events : function(){
    var leb=$('last_events_box');
    var cvs=leb.getElements('.nktalk_start_conversation');
    var p=$(window).parent;     
    if($defined(p) && $defined(p.nktalk)){
      cvs.each(function(el){
        var params = el.className.split(/\s/);
        var uid = params[params.length-1];
        el.addEvent(
          'click',
          function(){
            this.start_conversation(uid);
          }.bind(this)
        );
      }.bind(this));
    }else{
      cvs.each(function(el){
        el.destroy();
      });
    }
  }
});
var nktalk_watched_events = new NkTalkWatchedEvents();
$(window).addEvent('load',nktalk_watched_events.parse_events.bind(nktalk_watched_events));
