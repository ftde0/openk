activate_nk_talk_turn_on_button = function(){
  var button = $('turn_on_nktalk');
  if(button) {
    button.addEvent(
      'click', function(e) {
        e.stop();
        new AjaxYesNoPageHandler('/nktalk/turn_on',{
          onYes : function() { location.reload(true); }
        });
      }
    );
  }
}


$(window).addEvent(
  'load', function() {
    activate_nk_talk_turn_on_button();
  }
);
