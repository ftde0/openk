var Paginator = new Class({

  set_page: function(page) {
    this.page = page;
    if( this.page > this.page_count ) {
      this.page = this.page_count;
    }
    this.offset = (this.page - 1) * this.limit;
  },

  initialize: function(count, current_page, limit, type, neigh, onPageChange, container_id) {
    this.count = count;
    this.page = current_page;
    this.limit = limit;
    this.offset = 0;
    this.page_count = 0;
    this.neigh = neigh;
    this.type = type;
    this.onPageChange = onPageChange;

    var _this = this;

    this.containers = new Array();
    if ( container_id.constructor == Array ) {
      container_id.each(function (cont) {
        _this.containers.push($(cont));
      });
    } else {
      _this.containers = new Array($(container_id));
    }


    if( this.count == 0 ) {
      this.page = 1;
      this.page_count = 0;
    } else {
      this.page_count = Math.ceil(this.count / this.limit);
    }

    this.set_page(current_page);

  },

  refresh: function() {
    var _this = this;
    this.containers.each(function(cont) {
      cont.innerHTML = '';
    });
    var new_pagin = this.output();
    if( new_pagin != null ){
      this.containers.each(function(cont) {
        cont.grab(_this.output());
      });
    }
  },

  page_link: function(page) {
    var _this = this;
    var link = new Element('a', {
      'class': 'page_nr',
      'href': '#nogo'
    });
    var span = new Element('span', {
      'html': page
    });
    link.grab(span);
    link.addEvent('click', function() {
      _this.click_link(page);
      return false;
    });
    return link;
  },

  click_link: function(page){
    this.set_page(page);
    this.refresh();
    this.onPageChange(this.page, this.offset);
  },

  output: function() {
    if( this.page_count <= 1 ) return null;
    var _this = this;
    var main_div_class = 'paginator';
    if ( this.type != '' ) {
      main_div_class += ' ' + this.type;
    }
    var main_div = new Element('div', {
      'class': main_div_class
    });
    if ( this.page > 1 ) {
      var previous = new Element('a', {
        'class': 'previous',
        'title': 'Poprzednia strona',
        'href': '#nogo',
        'html': '&lsaquo; wstecz'
      });
      previous.addEvent('click', function() {
        _this.click_link(_this.page - 1);
        return false;
      });
      main_div.grab(previous);
    } else {
      var previous = new Element('span', {
        'class': 'previous',
        'html': '&lsaquo; wstecz'
      });
      main_div.grab(previous);
    }

    var start = Math.max(this.page - this.neigh, 1);

    if ( start > 1 ) {
      main_div.grab(this.page_link(1));
    }
    if ( start > 2 ) {
      var dots = new Element('span', {
        'class': 'hellip',
        'html': '&hellip;'
      });
      main_div.grab(dots);
    }

    for ( i=start; i < this.page; i+=1 ) {
      main_div.grab(this.page_link(i));
    }

    var actual = new Element('strong', {
      'html': this.page
    });
    main_div.grab(actual);

    var end = Math.min(this.page + this.neigh, this.page_count);
    for ( i=this.page + 1; i<=end; i+=1 ) {
      main_div.grab(this.page_link(i));
    }
    if ( end < this.page_count - 1 ) {
      var dots = new Element('span', {
        'class': 'hellip',
        'html': '&hellip;'
      });
      main_div.grab(dots);
    }
    if ( end < this.page_count ) {
      main_div.grab(this.page_link(this.page_count));
    }
    if ( this.page < this.page_count ) {
      var next = new Element('a', {
        'class': 'next',
        'href': '#nogo',
        'title': 'Następna strona',
        'html': 'dalej &rsaquo;'
      });
      next.addEvent('click', function(){
        _this.click_link(_this.page + 1);
        return false;
      });
      main_div.grab(next);
    } else {
      var next = new Element('span', {
        'class': 'next',
        'html': 'dalej &rsaquo;'
      });
      main_div.grab(next);
    }
    var clear = new Element('span', {
      'class': 'clear'
    });
    main_div.grab(clear);
    return main_div;
  }

});
