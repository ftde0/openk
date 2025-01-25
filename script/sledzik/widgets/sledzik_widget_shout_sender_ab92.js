var SledzikWidgetShoutSender = new Class({
  options: {
    content: null,
    max_length: 250,
    onCancel: $empty
  },
  
  initialize: function(options) 
  {
    var that = this;
    this.options = $extend(this.options, options);
    this.content = new Element('textarea', {
      'class': 'shout_text_input', 
      'text': this.options.content,
      'events': {
        'change': function() {     
          if(this.get('value').length >= that.options.max_length) {
            this.set('value',this.get('value').substring(0,that.options.max_length));
          }
        },
        'keyup': function(event) {
          this.fireEvent('change');
        },        
        'keypress': function(event) {
          if(event.key === 'enter') {
            this.fireEvent('submit',event);
          }
          if(this.value.length >= that.options.max_length && event.code>34 && event.code < 47) {
            return true;
          }
          if(this.value.length >= that.options.max_length && event.code>8 && event.code < 63200) {
            return false;
          }
          this.fireEvent('change');
        }
      }
    });
    
    this.only_friends = new Element('input',{'id': 'widget_only_friends', 'type': 'checkbox'});
    this.only_friends_label = new Element('label',{'for': 'widget_only_friends', 'text': 'tylko do znajomych'});
    
    this.popup = new Popup({
      width: 500,
      title: 'Dodawanie wpisu do Śledzika',
      extra_class: 'sledzik_shout_sender',
      content: [this.content, this.only_friends, this.only_friends_label],
      content_safe_mode: false,
      buttons: [
        {
          label: 'Wyślij',
          close: false,
          onClick: function() {
            var text = this.content.get('value').trim(); 
            if(text.length) {
              SledzikObserver.add_shout(text, this.only_friends.get('value'), 1);
            }
            this.popup.close();
          }.bind(this)
        },
        { label: 'Anuluj', onClick: this.options.onCancel }
      ]
    });
  }
  
});
