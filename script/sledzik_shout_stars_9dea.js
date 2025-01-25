/**
 * Popup z gwiazdkami
 * require popup.js
 */
var SledzikShoutStars = new Class({
  text: {
    add_star_by_know: 'Gwiazdki dodane przez Twoich znajomych:',
    add_star_by_unknow: 'Gwiazdki dodane przez nieznajomych:'
  },
  star_list: [],
  limit: 10,
  offset: 0,
  total_stars: 0,
  fetch_limit: null,
  fetch_offset: 0,

  url: null,
  uid: null,
  box: null, 
  contener: null,
  paginator_contener: null,

  initialize: function(url, uid)
  {
    this.url = url;
    this.uid = uid;
    this.total_stars = 0;
    this.popup = new Popup({
      'width': 300,
      'title': 'Wpis gwiazdkowali',
      'content': PopupConfig.loading,
      'position': null,
      'content_safe_mode': false
    });  
        
    this.box = new Element('div', {'class': 'star_box'});
    this.contener = new Element('ul', {'class': 'stars_contener'});
    this.paginator_contener = new Element('div', {'class': 'paginator_wrapper '});
    
    this.box.grab(this.contener).grab(this.paginator_contener);

    this.fetch();
  },
  
  fetch: function()
  {
    this.fetch_offset = this.fetch_limit ? (Math.floor(this.offset / this.fetch_limit) * this.fetch_limit) : 0;
    new Request.NK({
        url: this.url + '/js/' + this.fetch_offset,
        method: 'get',
        onSuccess: function(result) {
          for (var i = 0; i < result.DATA.UID.length; i++) {
            this.star_list[this.fetch_offset + i] = {};
          }
          ['UID','NAME','PHOTO_URI','IS_FRIEND','DATETIME'].each(function(field) {
            var data = result.DATA[field];
            for (var i = 0; i < data.length; i++){
              this.star_list[this.fetch_offset + i][field] = data[i];
            }
          }.bind(this));
          var current_page = Math.floor(this.offset / this.limit) + 1;
          this.total_stars = result.STAR_COUNT;
          this.fetch_limit = result.PAGE_LIMIT;
          this.paginator = new Paginator(result.STAR_COUNT, current_page, this.limit, 'graphic_paginator', 2, this.redraw.bind(this), this.paginator_contener);
          this.paginator.refresh();
          this.redraw(current_page, this.offset);
          this.create();
        }.bind(this)
    }).send();
  },

  create: function()
  {
    switch(this.total_stars) {
      case 1:
        var title = 'Ostatnio dodana gwiazdka do wpisu';
        break; 
      
      case 2:
        var title = 'Dwie ostatnio dodane gwiazdki do wpisu '+(this.total_stars > 2 ? 'z '+this.total_stars : '');
        break;
        
      default:
        var title = 'Wpis odznaczyli gwiazdką ('+this.total_stars+')';
    }
    
    this.popup.update({
      width: 600,
      content: this.box,
      position: null,
      title: title
    });

    this.create = $empty;
  },
  
  range_exists: function() {
    var limit = Math.min(this.limit + this.offset, this.total_stars);
    for (var i = this.offset; i < limit; i++) {
      if (!$type(this.star_list[i])) return false;
    }
    return true;
  },

  redraw: function(page, offset) 
  {
    this.offset = offset;
    if (!this.range_exists()) {
      this.fetch();
      return;
    }

    var temp_list = this.star_list.slice(this.offset, this.offset + this.limit).filter(function(elem) {
        return elem.UID !== null;
    });
    var know_author = Array();
    var unknow_author = Array();
    for(var i=0; i<temp_list.length; i++) {
      if(temp_list[i].IS_FRIEND) {
        if(temp_list[i].UID == this.uid) {
          know_author.unshift(temp_list[i]);
        } else {
          know_author.push(temp_list[i]);
        }        
      } else {
        unknow_author.push(temp_list[i]);
      }
    }
   
    this.contener.empty();    
    
    if(know_author.length) {      
      if(know_author[0].UID == this.uid) {
        this.contener.grab(this.render(know_author[0]));
        if(know_author.length > 1) {
          this.contener.grab(new Element('li',{'text': this.text.add_star_by_know , 'class':'header'}));
        }
      } else {
        this.contener.grab(new Element('li',{'text':this.text.add_star_by_know, 'class':'header'}));
      }
      
      for(var i=know_author[0].UID == this.uid ? 1 : 0; i<know_author.length; i++) {
        this.contener.grab(this.render(know_author[i]).addClass(i%2 != 0 ? 'parity': ''));
      }
    }
    
    if(unknow_author.length) {
      this.contener.grab(new Element('li',{'text': this.text.add_star_by_unknow.substitute({count:unknow_author.length}), 'class':'header'}));
      for(var i=0; i<unknow_author.length; i++) {
        this.contener.grab(this.render(unknow_author[i]).addClass(i%2 != 0 ? 'parity': ''));
      }
    }

    this.popup.center();
  },  
  
  render: function(data) 
  {
    var name = new Element('span', {'class': 'star'});
    var block = new Element('li', {'class': 'star'});

    if(data.UID == null) {
      name.grab(new Element('span',{'text': 'Osoba'}));
      var photo = new Element('span', {'class':'microavatar'});
    } else {
      name.grab(new Element('a', {'href': /profile/+data.UID, 'text': data.NAME }));
      var photo = new Element('a', {'href': '/profile/'+data.UID, 'class':'microavatar'});      
    }

    var img = new Image();
    img.onload = function() {
      if(data.PHOTO_URI == null) {
        $(this).addClass('brak_zdjecia');
      }
      if(this.width > this.height) {
        $(this).addClass('thumb_wide');
      }
      photo.grab(this);
    };
    img.src = data.PHOTO_URI == null ? getStaticUri('/img/avatar/brakzdjecia') : data.PHOTO_URI;
    
    var date = new Element(
      'span',
      {
        'class': 'datetime',
        'text': data.DATETIME
      }
    );

    var icon = (new Element(
        'span',
        {
          'class' : 'sledzik_star'
        }
      )
    );
    
    return block.grab(date).grab(photo).grab(icon).grab(name);
  }
});
