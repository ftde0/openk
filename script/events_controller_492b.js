var EventsController = new Class({
  attach: function(e)
  {
    if(e.inprogress) {
      return false;
    }
    
    var form = $(e.form);
    new AjaxForm(form, {
      'onSuccess': this.remove.bindWithEvent(this, form),
      'onFailure': function() { window.location.reload(); }
    });
    e.inprogress = true;
  },
  
  remove: function(response, form)
  {
    var contener = form.getParent('div.watched_events'); 
    var block = contener.getElements('table.event').length > 1 || contener.getElements('div.event.name_day, div.event.birthday').length > 0 ? form.getParent('table.event') : contener;
        block.set('morph',{'onComplete': function(e) { e.destroy(); }}).morph({'opacity': 0});
  }
});

var EventsCtrl = new EventsController();

$(window).addEvent('domready_nk', function() {
  var box = $('last_events_box');
  if(box) {
    box.getElements('div.watched_events').getElements('a').flatten().each( function(item) {
      switch(item.get('class')) {
        case 'photo_thmb': var type = 'photo';
          break;                
        case 'event_gift': var type = 'gift';
          break;                
        default: var type = 'link';                
      }
      item.set('href', '/quickmenu/redirect?source=box&type=' + type + '&target=' + item.get('href'));
    });
  }
});
