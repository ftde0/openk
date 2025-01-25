var Menu = new Class({
  options: {    
    delay_in: 50,
    delay_out: 350,
    tab_class: 'tab',
    tab_class_active: 'active_tab',
    hover_class: 'hover',
    hover_active_class: 'hover_active'    
  },
  
  stid: null,
  htid: null,
  tabs: null,
  current: null,
  
  initialize: function()
  { 
    this.tabs = $('page_menu').getElements('li.tab');
    this.form = $('mini_search');
    this.search = $('mini_search_query');
    $(document.html).removeClass('menu_old');
    
    this.tabs.each(function(item) {
      item.addEvents({
        mouseenter: function(item) { 
          if(this.htid !== null) {
            $clear(this.htid);
            this.htid = null;
          }
          this.stid = this.show.delay(this.options.delay_in, this, item);
        }.bind(this, item),
        
        mouseleave: function() {
          if(this.stid !== null) {
            $clear(this.stid);
            this.stid = null;
          }
          this.htid = this.hidden.delay(this.options.delay_out, this);     
        }.bind(this)
      });
      
    }.bind(this));
    
    if(this.form) {
      this.form.addEvent('submit', function(e) {
        if(this.search.get('value').trim() == 'Szukaj w Naszej-Klasie') {
          e.stop();
        }
      }.bind(this));
    }
    
    if(this.search) {
      this.search.addEvents({        
        'blur': function(e) {
          if(e.target.get('value').trim() == '') {
            e.target.set('value','Szukaj w Naszej-Klasie');
          }
        },
        'focus': function(e) {
          if(e.target.get('value') == 'Szukaj w Naszej-Klasie') {
            e.target.set('value','');
          }
        }
      });
    }
  }, 
  
  show: function(item) 
  {    
    if(this.current != null) {
      this.current.removeClass(this.options.hover_class).removeClass(this.options.hover_active_class);
    }
    this.stid = null;
    this.current = item;
    this.current.addClass(this.current.hasClass(this.options.tab_class_active) ? this.options.hover_active_class : this.options.hover_class);    
  },
  
  hidden: function()
  {
    if(this.current !== null) {
      this.current.removeClass(this.options.hover_class).removeClass(this.options.hover_active_class);
      this.current = null;
    }
  }
});

$(window).addEvent('menuready_nk', function() {
  new Menu();
});
