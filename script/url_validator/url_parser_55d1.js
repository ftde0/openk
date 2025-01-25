var UrlParser = new Class({
  filters: UrlFilterList,

  url_validator : new UrlValidator(),

  buffer: [],
  running: false,

  /**
   * Funkcja parsuje wszystkie pasujace elementy DOM-a
   *
   * @param string|Element {selektor} - selektor lub tablica elementów
   */
  run: function(selektor, validate, leave_new_lines) 
  {  
    var run_validate = validate || false;
    
    if(this.running) {
      this.buffer.push(selektor);
      this.validate |= run_validate; 
      return;
    }
    
    var that = this;
    this.buffer = [];
    this.running = true;
    this.found_urls = new Array();
    this.found_block = $$(selektor);
    for(var i=0, l=this.found_block.length; i<l; i++) {
      var j=0;

      this.found_block[i].set('html',this.found_block[i].get('html').replace(/(<wbr>|<\/wbr>)/gi,''));
      this.found_block[i].found_text_nodes = new Array();

      for(var j = 0; j< this.found_block[i].childNodes.length; j++) {
        if(this.found_block[i].childNodes[j].nodeType == 3) {
          var node_value = this.found_block[i].childNodes[j].nodeValue.replace(/(\[|\])/g,"\\$1");
          if (!leave_new_lines) node_value = node_value.replace(/(\n\n|\r\n)/g," [b]");
          this.found_block[i].found_text_nodes.push({'node': this.found_block[i].childNodes[j], 'value': node_value});
          this.found_urls.combine(this.filters[0].get_all_urls(this.found_block[i].found_text_nodes[this.found_block[i].found_text_nodes.length -1].value));
        }
      }
    }

    this.found_urls.sort(function(a,b){return b.length-a.length;});

    var found_urls_more = this.found_urls.map(
      function (item,index) {
        return  {
          'hash': that.toHash(item),
          'mask': '['+index+']',
          'info': run_validate ? null : {'status': 2, 'message': ''}
        };
      }
    );

    if(run_validate) {
      this.url_validator.check_urls(found_urls_more.associate(this.found_urls), this.on_check_complete.bind(this, [found_urls_more.associate(this.found_urls)]));
    } else {
      this.on_check_complete(found_urls_more.associate(this.found_urls));
    }
    found_urls_more = null;
  },

  /**
   * Funkcja wywoływana po zakończeniu walidacji url-i
   *
   * @param Hash {urls} - tablica associacyjna url-i 'url'=> { 'hash': xxx , 'mask' : xxx , 'status': xxx }
   */
  on_check_complete: function(urls)
  {
    for(var url in urls) {
      var reg = new RegExp('\\b' + url.escapeRegExp() ,'g');
      for(var i=0, l=this.found_block.length; i<l; i++) {
        for(var j=0, k=this.found_block[i].found_text_nodes.length; j<k; j++) {
          this.found_block[i].found_text_nodes[j].value = this.found_block[i].found_text_nodes[j].value.replace(reg,urls[url].mask);
        }
      }
    }
    for(var i=0, l=this.found_block.length; i<l; i++) {
      for(var j=0, k=this.found_block[i].found_text_nodes.length; j<k; j++) {
        this.found_block[i].found_text_nodes[j].value = break_string(this.found_block[i].found_text_nodes[j].value, 32,8);
      }
    }
    try {
      for(var url in urls) {
        var reg = new RegExp( urls[url].mask.escapeRegExp() ,'g');
        var modify_url = this.get_new_url(url,urls[url].info);
        for(var i=0, l=this.found_block.length; i<l; i++) {
          for(var j=0, k=this.found_block[i].found_text_nodes.length; j<k; j++) {
            this.found_block[i].found_text_nodes[j].value = this.found_block[i].found_text_nodes[j].value.replace(reg, modify_url);
          }
        }
      }
    }
    catch(error) {}

    for(var i=0, l=this.found_block.length; i<l; i++) {
      for(var j=0, k=this.found_block[i].found_text_nodes.length; j<k; j++) {
        this.found_block[i].found_text_nodes[j].value = this.found_block[i].found_text_nodes[j].value.replace(/\s\[b\]/g,'<br>').replace(/\\(\[|\])/g,"$1");
        var element = new Element('span',{html: this.found_block[i].found_text_nodes[j].value});
        this.found_block[i].found_text_nodes[j].value = null;
        
        while(element.childNodes[0]) {
          this.found_block[i].found_text_nodes[j].node.parentNode.insertBefore(element.childNodes[0], this.found_block[i].found_text_nodes[j].node);
        }
        this.found_block[i].found_text_nodes[j].node.parentNode.removeChild(this.found_block[i].found_text_nodes[j].node);
      }

      this.found_block[i].getElements('.link.bad').each(
        function(item) {
          item.addEvent('click', function(e) {
              e.stop();
              this.show_warning_box( e.target.getElement('span.link_msg').get('text'), function() {
                  window.open( e.target.get('href'),'_blank');
                }
              );
            }.bind(this)
          );
        }.bind(this)
      );

      this.found_block[i].getElements('.player').each(
        function(item) {
          item.addEvent('click', function(e) { e.stop(); this.show_movie(item); }.bind(this) );
        }.bind(this)
      );
    }

    urls = null;
    this.running = false;
    this.found_urls = null;
    this.found_block = null;
    
    if(this.buffer.length) {
      var validate = this.run_validate;
      this.run_validate = false;
      this.run(this.buffer, validate);
    }
  },

  /**
   * Funkcja wyświetla box-a z ostrzeżeniem o złym linku
   * @param string {title} - tytuł box-a
   * @param function {on_yes} - funkcja wykonana po wcisnięciu klawisza ok
   * @param function {on_no} - funkcja wykonana po wcisnięciu klawisza anuluj
   *
   */
  show_warning_box: function(message, on_yes, on_no)
  {
    if(message.test(/google/i)) {
      var msg = '<a class="attention" href="http://code.google.com/intl/pl/apis/safebrowsing/safebrowsing_faq.html#whyAdvisory" target="_blank">'+message+'</a>';
    } else {
      var msg = '<span class="attention">'+message+'</span>';
    }
    new Popup(
      {
        'width': 500,
        'title': '<span class="raquo">&raquo;</sapn> Przejście na polecony adres',
        'content_safe_mode': false,
        'content': msg+'Ten link został rozpoznany jako niebezpieczny. Otwierasz go na własną odpowiedzialność.<br>Czy na pewno chcesz to zrobić?<br>',
        'buttons': [
          {
            'label': 'Tak',
            'onClick': on_yes || $empty
          },
          {
            'label': 'Nie',
            'onClick': on_no || $empty
          }
        ]
      }
    );
  },

  /**
   * Funkcja uruchamia playera
   * @param Element {link} - obiekt linku
   */
  show_movie: function(link)
  {
    try {
      if(link.hasClass('bad')) {
        this.show_warning_box(link.getElement('span.link_msg').get('text'), GenericPlayer.play.bind(player,[link.get('href')]));
      } else {
        GenericPlayer.play(link.get('href'));
      }
    } catch(error) {
      window.open(link.get('href'),'_blank');
    }
  },

  /**
   * Funkcja pobiera nowy format urla dla podanego url-a
   *
   * @param string {url} - url którego chcemy podmienić
   */
  get_new_url: function(url,info)
  {
    for(var i=this.filters.length-1; i>=0; i--) {
      if(this.filters[i].is_recognised_url(url)) {
        return this.filters[i].get_new_url(url,info);
      }
    }
    return url;
  },


  toHash: function(text)
  {
    var temp = '', hex = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
    for(var i=0; i<text.length; i++) {
      var value = text.charCodeAt(i);
      temp += hex[Math.floor(value / 16)]+hex[value % 16];
    }
    return temp;
  }
});

