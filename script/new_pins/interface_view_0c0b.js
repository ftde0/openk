var InterfaceView = new Class({
  Extends : InterfaceAbstract,
  extendFriend : function(friend) {
    var that = this;
    if(friend.friend_id != this.module.uid) {
      return;
    }
    var block_button = this.createBlockButton();
    if(friend.flags == 0) {
      block_button.addEvent('click', function(){
        that.blockUser.bind(that)(friend.pin_id);
      });
    }
    if (friend.flags == 1) {
      block_button.addEvent('click', function(){
        that.removePinHandler.bind(that)(friend.pin_id);
      });
    }
    friend.element.grab(block_button, 'top');
  },
  extendPin : function(pin) {
    var that = this;
    if(pin.data.friend_id == this.module.uid) {
      var info_remove_button = new Element('a', {
        'class' : 'info_remove_button',
        'href' : '#del',
        'html' : 'Usuń adres mojego profilu z tego zdjęcia'
      });
      info_remove_button.addEvent('click', function(e) {
        e.stop();
        if (pin.data.flags.toInt() === 0) {
          that.blockUser.bind(that)(pin.data.id);
        } else if(pin.data.flags.toInt() === 1) {
          that.removePinHandler.bind(that)(pin.data.id);
        }
      });
      var pin_info_box = pin.box.getElement('div.pin_info_box');
      pin_info_box.grab(new Element('hr', {'class' : 'spacer'}));
      pin_info_box.grab(info_remove_button);
    } 
  }
});
