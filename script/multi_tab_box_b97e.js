nk_options.multitab = {};

var MultiTabBox = new Class({  
  class_button: 'button',
  class_button_push: 'push',
  class_button_hover: 'hover',  
  
  current_index: 0,  
  
  initialize: function(box_id, config)
  {
    this.config = config;
    this.current_index = this.config.current;
    this.box = $(box_id);
    this.conteners = this.box.getElements('div.content');
    
    this.create_button_bar().injectTop(this.box.getElement('div.cool_box_inner'));
  },
  
  change_tab: function(new_index,old_index) 
  {
    if(this.config.tabs[new_index].url) {
      new Request(
        {
          url: this.config.tabs[new_index].url,
          method: 'get',
          onSuccess: function(response) {
            this.conteners[new_index].set('html',response);
            this.config.tabs[new_index].url = null;
            this.replace(new_index,old_index);
            IsKnown.displayPlaceholders();
            Avatar.onload();
          }.bind(this),
          
          onFailure: function() {
            this.conteners[new_index].set('html','Nie można pobrać danych.<br>Spróbuj ponownie za chwilę.');
            this.replace(new_index,old_index);
          }.bind(this)
        }
      ).send();
    } else {
      this.replace(new_index,old_index);
    }
    this.current_index = new_index;
  },
  
  replace: function(new_index, old_index)
  {
    this.conteners[old_index].set('morph',
      {
        duration: 200,
        onComplete: function() {
          this.conteners[old_index].addClass('hidden');
          this.conteners[new_index].set('opacity',0).removeClass('hidden').fade('in');
        }.bind(this)
      }
    ).morph({opacity: 0});
  },
  
  create_button_bar: function()
  {
    var that = this;
    
    var bar = new Element(
      'div',
      {
        'class' : 'button_bar'
      }
    );
    
    for(var i=0; i<this.config.tabs.length; i++)
    {
      var button = new Element('span',
        {
          'text' : this.config.tabs[i].name, 
          'class' : this.class_button,
          'events' : {
            'click' : function() {
              bar.getElements('span').removeClass(that.class_button_push);
              this.addClass(that.class_button_push);
              if(that.current_index != this.index) {
                that.change_tab(this.index, that.current_index);
              }
            },
            'mouseover' : function() {
              this.addClass(that.class_button_hover);
            },
            'mouseout' : function() {
              this.removeClass(that.class_button_hover);
            }
          }
        } 
      ).grab(new Element('span',{}));

      if(i==this.current_index) {
        button.addClass(this.class_button_push);
      }
      
      button.index = i;
      bar.grab(button);
    }
    
    return bar;
  }
});

$(window).addEvent('domready_nk',
  function() {
    for(var key in nk_options.multitab) {
      new MultiTabBox(key, nk_options.multitab[key]);
    }
  }
);
