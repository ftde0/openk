var ForumSchoolTab = new Class({
  initialize: function() 
  {
    ClientStorage.wait_storage(this.change_tabs.bind(this));
  },

  change_tabs: function()
  {
    this.cache = ClientStorage.get_storage();
    
    this.links = new Array();
    this.titles = new Array();
    this.conteners = new Array();
    this.xbox_button = new Array();
    
    this.current = (this.current = this.get_tab_index()) == null ? 0 : this.current;
    this.labels = new Array('Fora','Szkoły');
    this.boxs = $$('div.box.forums, div.box.schools');
    if(this.boxs.length) {
      this.boxs.each(function(item,index) {
        var title = item.getElement('div.box_header a');
        this.links.push(title.get('href'));
        this.titles.push(title.get('text'));
        this.conteners.push( new Element('div',{'class': index == this.current ? '' :'hidden'}));
        this.conteners[index].adopt(item.getElement('div.box_content').getChildren());
        
        this.xbox_button.push(item.getElement('div.rozwin a').dispose());
        
        if(index > 0) {
          item.destroy();
          this.xbox_button[index].addClass('hidden');
        }
        
      }.bind(this));    
    
      this.title = this.boxs[0].getElement('div.box_header a');
      this.contener = this.boxs[0].getElement('div.box_content');    
      this.contener.grab(this.create_tab(this.labels),'top');
      this.contener.adopt(this.conteners);
      this.boxs[0].getElement('div.rozwin').adopt(this.xbox_button);
      
      if(this.current!=0) {
        this.change_tab(0, this.current);
      }
    }
  },
  
  create_tab: function(labels)
  {
    var that = this;
    var buttons = new Array();
    var tab = new Element('div', {'class': 'small_tabs_container'});
    var contener = new Element('ul', {'class': 'forum_school_tabs'});    
    
    labels.each(function(item,index) {
        var button = new Element('li', 
          {
            'html': '<span>'+item+'</span>', 
            'class': this.current == index ? 'active' : '',
            'events': {
              'click': function() {
                contener.getElements('li').removeClass('active');
                this.addClass('active');
                if(this.index != that.current) {
                  that.change_tab(that.current, this.index);
                  that.current = this.index;
                  that.save_tab_index(that.current);
                }
              }
            }
          }
        );
        button.index = index;
        button.inject(contener);
        buttons.push(button);
      }.bind(this)
    );
    
    tab.grab(contener);
    
    return tab;
  },
  
  change_tab: function(old_index, new_index) {
    this.conteners[old_index].set('morph',
      {
        duration: 200,
        onComplete: function() {
          this.conteners[old_index].addClass('hidden');
          this.conteners[new_index].set('opacity',0).removeClass('hidden').fade('in');
          this.xbox_button[old_index].addClass('hidden');
          this.xbox_button[new_index].removeClass('hidden');
          this.title.set('href',this.links[new_index]);
          this.title.set('text',this.titles[new_index]);
        }.bind(this)
      }
    ).morph({opacity: 0});
  }, 
  
  get_tab_index: function() {
    if(this.cache) {
      return this.cache.get('forum_shool_tab_index');
    }
    return null;
  },
  
  save_tab_index: function(index) {
    if(this.cache) {
      this.cache.set('forum_shool_tab_index', index, null, true);
    }    
  }
  
  
});

$(window).addEvent('domready_nk', function() {
  new ForumSchoolTab();
});
