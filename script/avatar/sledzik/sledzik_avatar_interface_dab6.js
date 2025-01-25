var SledzikAvatarInterface = new Class({
  
  get_followee_form: function(type) 
  {
    var is_f = this.user_data.is_followee;
    
    return new Element('form', {
      'html': is_f ? '<button class="dont_followee" title="Nie śledź" type="submit"><span>Nie śledź</span></button>':'<button class="followee" title="Śledź" type="submit"><span>Śledź</span></button>',
      'class': is_f ? 'remove_followee' : 'add_followee',
      'events': {
        'submit': function(e, uid, type, is_followee) {
           if(e.target.loadin) {
             return;
           }
           e.target.loadin = true;
           if(is_followee) {
             SledzikObserver.remove_followee(uid);
           } else {
             SledzikObserver.add_followee(uid, type);
           }
        }.bindWithStopEvent(null, [this.user_data.id, type || null, this.user_data.is_followee])
      }
    });
  }
});

var SledzikPromotedAvatarInterface = new Class({
  
  get_promoted_ignored_form: function() 
  {
    return new Element('form', {
      'html': '<button class="ignore_promoted" title="Ignoruj" type="submit"><span>Ignoruj</span></button>',
      'class': 'add_promoted_ignored',
      'action': '/sledzik/promoted/add_ignored',
      'method': 'post',
      'events': {
        'submit': function(e, uid) {
           if(e.target.loadin) {
             return;
           }
           e.target.loadin = true;
           SledzikObserver.add_promoted_ignored(uid); 
        }.bindWithStopEvent(null, [this.user_data.id])
      }
    });
  }
});
