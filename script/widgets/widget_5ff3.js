var WidgetFactory = new Class({
  get : function(type, wid, options) {
    switch (type) {
      case '2' :
        return new GPWidget(wid, options);
        break;
      case '3' :
        return new IplaWidget(wid, options);
        break;
      case '4' :
        return new PrzypominaczWidget(wid, options);
        break;
      case '1' : 
        return new AllegroWidget(wid, options);
        break;
        
      default :
        return new Widget(wid, options);
    }
  }
});

var Widget = new Class({
  Implements : [Options, Events],
  options : {
    offset      : 0,
    api_uri     : '/okienka/api',
    wrapper     : null,
    list_prefix : 'widget_',
    name        : 'Okienko',
    more_url    : '/okienka',
    with_temp   : 0,
    hidden      : 0,
    index       : 1,
    type        : 1,
    extra_class : '',
    registered_user : 1,
    show_more_text  : 'zobacz więcej',
    show_more_title : 'Pokaż więcej ofert'
  },
  add_extra_options : function() {
    return {};
  },
  
  initialize : function (widget_id, options) {
    this.setOptions(options);
    this.setOptions(this.add_extra_options());
    this.widget_id = widget_id; //ID Widget'a
    this.status = 0;            //Status operacji IO, 0->Zainicjalizowany
    this.loading = false;       //Czy coś jest robione (pobiera się nowa lista itp)
    this.items = null;          //Pobrane elementy
    this.items_container = null;//Kontener z elementami
    this.stored_items = Array();
  },
  //Metody wirtualne, dla ew. placementów reklamowych
  draw_footer_ad : function() { 
    return null;
  },
  // -- Display informations/error messages --
  display_loading_info : function() {
    this.loading_info_wrapper.grab( new Element('img', {src : getStaticUri('/img/ajax_loading_circle')}));
  },
  hide_loading_info : function() {
    this.loading_info_wrapper.empty();
  },
  items_not_found_info : function() {
    return this.get_error_info();
  },
  get_error_info : function() {
    var info_img = new Element('img', {'src' : getStaticUri('/img/widgets/brak_danych'), 'alt' : 'Informacja o błędzie' });
    var info_msg = new Element('p', {'class' : 'warning', 'text' : this.error_msg});
    var wrapper = new Element('div', { 'class' : 'content'});
    wrapper.adopt(info_img, info_msg);
    return wrapper;
  },
  handle_error : function() {
    switch (this.status) {
      case -7 :
        var content = this.items_not_found_info();
        break;
      default :
        var content = this.get_error_info();
    };
    return Array(content, this.draw_footer_ad());
  },
  // -- AJAX Requests --
  get_items : function() { //pobieranie nowych elementów 
    this.loading = true;
    this.display_loading_info();
    if (this.stored_items[this.options.offset]) {
      this.items = this.stored_items[this.options.offset];
      this.redraw();
      return;
    };
    var ajax = new Request.NK({
      method : 'get',
      url    : this.options.api_uri + '/get_products/' + this.widget_id + '/' + this.options.offset,
      data   : {
        temp   : this.options.with_temp
      }, 
      onFailure : function(request) {
        this.hide_loading_info();
        this.status = 10;
        this.error_msg = 'Nie można połączyć z usługą';
        this.draw_error();
        this.loading = false;
      }.bind(this),
      onException : function(header, value) {
        this.hide_loading_info();
        this.status = 11;
        this.error_msg = 'Nie można połączyć z usługą';
        this.draw_error();
        this.loading = false;
      }.bind(this),
      onSuccess : function(json){
        this.hide_loading_info();
        this.parse_items(json);
        this.redraw();
      }.bind(this)
    }).send();
  },
  send_new_visible_state : function (new_state) { //zmiana stanu okienka
    var ajax = new Request.NK({
      method : 'post',
      url    : this.options.api_uri + '/change_visible_state/' + this.widget_id + '/' + new_state
    }).send();
  },
  parse_items : function(response) {
    this.status = response[0];
    if (this.status == 1) {
      this.stored_items[this.options.offset] = response[1];
      this.items = response[1];
    } else {
      this.items = false;
      this.error_msg = response[1].message;
    };
  },
  // ------------------------------------ UKRYWANIE I POKAZYWANIE
  toggle : function () {
    if (this.options.hidden) {
      this.show();
    } else {
      this.hide();
    };
  },
  hide : function () {
    this.options.hidden = 1;
    this.removeClass('widget_show');
    this.addClass('widget_hide');
    this.send_new_visible_state(1);
    this.fireEvent('hide');
  },
  show : function () {
    this.fireEvent('show');
    if (this.items === null){
      this.get_items();
    };
    this.addClass('widget_show');
    this.removeClass('widget_hide');
    this.options.hidden = 0;
    this.send_new_visible_state(0);
  },
  box_hide : function() {
    this.removeClass('widget_show');
    this.addClass('widget_hide');
  },
  box_show : function() {
    if (!this.options.hidden) {
      this.addClass('widget_show');
      this.removeClass('widget_hide');
    };
  },
  remove_widget : function() {
    this.dispose();
  },
  animate : function(old_items, new_items, container) {
    //old_items -> Kontener z poprzednimi przedmiotami (znajdujact sie w container); 
    //new_items -> kontener z nowymi przedmiotami; 
    //container -> kontener opinający
    //funkcja musi usunąc old_items, i wrzucić do container new items, przy okazji może z jakaś animacją.
    container.setStyle('height', old_items.getHeight());
    new_items.setStyles({'opacity' : '0', 'position' : 'absolute'});
    old_items.setStyle('position', 'absolute');
    container.adopt(new_items);
    old_items.set('tween', {onComplete : function() {old_items.dispose();} });
    new_items.set('tween', {onComplete : this.animation_complete.bind(this)}) ;
    new_items.tween('opacity', 1);
    old_items.tween('opacity', 0);
    //container.tween('height', new_items.getHeight());
  },
  draw : function() {
    var object = new Element('li', {id : this.options.list_prefix + this.widget_id, 'class' : 'widget', styles : { 'z-index' : 1000-this.options.index}});
    $extend(object, this);
    if (this.options.hidden) {
      object.addClass('widget_hide');
    } else {
      object.addClass('widget_show');
    }
    object.adopt(object.get_header(), object.draw_inner());
    return object;
  },
  draw_error : function() {
    var container = this.getElement('div.content');
    if (container) {
      var error_info = this.handle_error();
      container.empty();
      container.adopt(this.get_error_info());
    } else {
      this.adopt(this.handle_error());
    }
  },
  animation_complete : function() {
    this.hide_loading_info();
    this.loading = false;
  },
  
  redraw : function() { //draw/redraw Widget elements
    var container = this.getElement('div.content');
    if (container) { //animacja bo okienko jest wypełnione
      var old_items = container.getElements('div');
      var new_items = this.draw_items();
      this.animate(old_items[0], new_items, container);
      this.update_navigation_bar();
    }  else {
      this.adopt(this.draw_inner()); //poprostu rysujemy srodek
      this.animation_complete();
    }
  },
  draw_inner : function() {
    if (this.options.hidden) {
      return null;
    }
    if (this.status == 1) {
      this.items_container = new Element('div', {id : this.options.list_prefix + 'items_' + this.widget_id, 'class' : 'content'});
      this.items_container.addClass(this.options.extra_class);
      this.items_container.adopt(this.draw_items());
      return Array(this.items_container, this.draw_navigation_bar(), this.draw_footer_ad());
    } else {
      return this.handle_error();
    }
  },
  
  // ----------------------- GENEROWANIE POSZCZEGÓLNYCH ELEMENTÓW
  // ----------------------- MENU
  get_menu : function (host) {
    var menu = new Element('div', {'class' : 'widget_menu hidden', id : 'widget_menu_' + this.widget_id, events : {
        'mouseleave' : function() { this.addClass('hidden');},
        'click'      : function() { this.addClass('hidden');}
      }});
    var menu_list = new Element('ul');
    var change_params_li = new Element('li');
    change_params_li.grab(new Element('a', {'href' : host + '/okienka/' + this.widget_id, 'class' : 'widget_menu_configure_desc', 'text' : 'Zmień ustawienia'}));
    menu_list.grab(change_params_li);
    if (this.options.registered_user) {
      var remove_widget_li = new Element('li');
      var link =  new Element('a', {
          href : host + '/okienka/usun/' + this.widget_id, 
          'class' : 'widget_menu_remove_desc', 
          'text' : 'Usuń Okienko'});
      link.addEvent('click', function(e){
        e.stop();
        var widgets_popup = new AjaxYesNoPageHandler('/okienka/usun/' + this.widget_id,{
          onYes : function() {
            if (this.options.with_temp) {
              document.location = '/okienka';
            } else { 
              this.remove_widget();
              this.fireEvent('remove');
            }
          }.bind(this)
        });
      }.bind(this));
      remove_widget_li.grab(link);
      menu_list.grab(remove_widget_li);
    };
    //here we can client specific options in menu
    menu.grab(menu_list);
    return menu;
  },
  // ----------------------- NAGŁÓWEK
  get_header : function () {
    var host = document.location.protocol + '//' + document.location.hostname; //Everybody loves nktalk
    var header = new Element('h4', {'class' : 'widget_title'});
    var menu = this.get_menu(host);
    var tools =  new Element('span', {'class' : 'tool', events : {
      click : function() {
        menu.toggleClass('hidden');
      }
    }});
    tools.grab(new Element('img', {'src' : getStaticUri('/img/widget_tool.png')}));
    var hider =  new Element('span', {'class' : 'show_hide_content', events : {
      click : this.toggle.bind(this)
    }});
    hider.grab(new Element('img', {'src' : getStaticUri('/img/widget_arrow.png')}));
    this.loading_info_wrapper = new Element('span', {'class' : 'loading_ico'});
    var widget_link = new Element('a', {'text' : this.options.name, 'class' : 'title'}); 
    if (!this.options.with_temp) {
      widget_link.set('href', host + '/okienka/' + this.widget_id);
    }
    header.adopt(widget_link, this.loading_info_wrapper, menu, tools, hider);
    return header;
   },
   //----------------------- ELEMENTY
  draw_items : function() {
    var div = new Element('div', {'class' : 'offers'});
    div.addClass(this.options.extra_class);
    var items_count = this.items.data.length;
    for (var i = 0; i < items_count; i++) {
      var data = this.items.data[i];
      var anchor = new Element('a', {'target' : '_blank', 'href' : data['url']});
      var img_container = new Element('div', {'class' : 'widget_image'});
      var p = new Element('p', {'class' : 'description' });
      var anchor2 = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : data['name']});
      p.grab(anchor2);
      var location = new Element('p', {'class' : 'location'});
      var anchor3 = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : data['location']});
      location.grab(anchor3);
      var size = new Element('p', {'class' : 'extra'});
      var size_anchor = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : 'Powierzchnia: '});
      var size_text = new Element('span', {'html' : data['extra']});
      size.grab(size_anchor);
      size_anchor.grab(size_text);
      var p2 = new Element('p', {'class' : 'price', 'html' : data['value']});
      var image_loader = new Asset.image(this.items.data[i]['img'], {
        title: data['name'], 
        alt : this.items.data[i]['name'], 
        onload: function() {
          this.addClass('widget_image');
          this.replaces(img_container);
          div.getParent().tween('height', div.getHeight());
        }, 
        onerror : function() { 
          var height = div.getHeight() + p.getHeight() + location.getHeight() + size.getHeight() + p2.getHeight();
          img_container.grab(Element('img', {src : getStaticUri('/img/widgets/brakzdjecia'), 'title' : 'Brak zdjęcia', alt : 'Brak zdjęcia', height : '100'}));
          div.getParent().tween('height', height + 12);
        }
      });
      anchor.grab(img_container);
      div.adopt(anchor, p, location, size, p2);
    };
    return div;
  },
  //----------------------- NAWIGACJA
  draw_navigation_bar : function() {
    var ul = new Element('ul', {'class' : 'navigation', id : 'offer_navigation_' + this.widget_id});
    var li_prev = new Element('li', { 'class' : 'prev'});
    var prev = new Element('span', {id : 'offer_prev_' + this.widget_id, 'html' : '&laquo;', events : {
      click : this.get_prev_items.bind(this)
    }});
    if (this.has_prev_item()) {
      prev.addClass('active');
    }
    var li_center = new Element('li', {'class' : 'center'});
    var center = new Element('a', {'href' : this.options.more_url, 'text' : this.options.show_more_text, 'title' : this.options.show_more_title, 'target' : '_blank'});
    var li_next = new Element('li', { 'class' : 'next'});
    var next = new Element('span', {id : 'offer_next_' + this.widget_id, 'html' : '&raquo;', events : {
      click : this.get_next_items.bind(this)
    }});
    if (this.has_next_item()) {
      next.addClass('active');
    }
    li_prev.grab(prev);
    li_center.grab(center);
    li_next.grab(next);
    ul.adopt(li_prev, li_center, li_next);
    this.navigation_bar = ul;
    this.next_button = next;
    this.prev_button = prev;
    return ul;
  },
  //----------------------- Przechodzenie pomiędzy elementami, aktualizacja navibara
  has_next_item : function() {
     if (!this.items) {
       return false;
     }
     return this.items.show_next;
   },
   has_prev_item : function () {
     if (!this.items) {
       return false;
     }
     return this.items.show_prev;
   },
   get_next_items : function() {
     if (!this.has_next_item() || this.loading) { return false; }
     this.options.offset++; 
     this.get_items();
   },
   get_prev_items : function() {
    if (!this.has_prev_item() || this.loading) { return false; }
    this.options.offset--; 
    this.get_items();
  },
  update_navigation_bar : function() {
    if (!this.navigation_bar) {
      return;
    }
    if (this.has_next_item()) {
      this.next_button.addClass('active');
    } else {
      this.next_button.removeClass('active');
    }
    if (this.has_prev_item()) {
      this.prev_button.addClass('active');
    } else {
      this.prev_button.removeClass('active');
    }
  }
});

// ----------------------------------------------------- IPLA WIDGET ------------------------------------------------
var IplaWidget = new Class({
  Extends : Widget,
  add_extra_options : function() {
    return {
      show_more_text  : 'więcej w ipla',
      show_more_title : 'Pokaż więcej filmów',
      extra_class : 'ipla'
    };
  },
  draw_footer_ad : function() {
    var div = new Element('div', {'class' : 'widget_footer ipla_info_box'});
    div.grab(new Element('a', {'text' : 'Odwiedź profil IPLA na Naszej Klasie ', 'href' : '/ipla'}));
    return div;
  },
  draw_items : function() {
    var div = new Element('div', {'class' : 'offer'});
    var items_count = this.items.data.length;
    for (var i = 0; i < items_count; i++) {
      var data = this.items.data[i];
      var ipla_logo = new Element('img', {'src' : getStaticUri('/img/widgets/partners/ipla_logo_small'), 'alt' : 'Logo IPLA', 'class' : 'img_ipla_logo'});
      var movie_img = new Element('img', {'src' : data['img'], alt : data['name']});
      var img_container = new Element('div', {'class' : 'widget_image'});
      var ipla_link = new Element('a', {'href' : data['url'], 'title' : 'Pokaż film', 'target' : '_blank'});
      var movie_name = new Element('a', {'class' : 'moovie_name', 'html' : data['name'], 'href' : data['url']});
      var movie_description = new Element('a', {'class' : 'moovie_desc', 'html' : data['desc'], 'href' : data['url']});
      var stars_container = new Element('div', {'class' : 'marks'});
      var image_loader = new Asset.image(data['img'], {
        title: data['name'],
        alt  : data['name'],
        styles : { height : 'auto', width : '98%' },
        onload: function(){
          image_loader.addClass('widget_image');
          this.items_container.tween('height', div.getHeight());
        }.bind(this),
        onerror : function() {
            var err_img = new Element('img', {src : getStaticUri('/img/widgets/brakzdjecia'), 'title' : 'Brak zdjęcia', alt : 'Brak zdjęcia', styles : {'height' : '100px'}});
            this.items_container.tween('height', div.getHeight() + 75);
            err_img.replaces(movie_img);
        }.bind(this)
      });
      var movie_link = ipla_link.clone();
      movie_link.grab(movie_img);
      img_container.grab(movie_link);
      stars_container.grab(new Element('span', {'class' : 'marks_info', 'text' : 'Ocena:'}));
      if (!data['value']) {
       data['value'] = 0;
      };
      var marks_round = Math.floor(data['value'].replace(/\,/g, '.'));
      var ipla_full_mark = new Element('img', {'src' : getStaticUri('/img/widgets/partners/ipla_mark_full')});
      for (var j = 0; j < marks_round; j++) {
        stars_container.grab(ipla_full_mark.clone());
      };
      if ((marks_round + 0.5) <= data['value']) {
        stars_container.grab(new Element('img', {'src' : getStaticUri('/img/widgets/partners/ipla_mark_half')}));
        marks_round++;
      };
      for (marks_round; marks_round < 5; marks_round++) {
        stars_container.grab(new Element('img', {'src' : getStaticUri('/img/widgets/partners/ipla_mark_empty')}));
      };
      div.adopt(ipla_logo, img_container, movie_name, movie_description, stars_container);
    }
    return div;
  }
});

//----------------------------------------------------- Allegro WIDGET ------------------------------------------------

var AllegroWidget = new Class({
  Extends : Widget,
  add_extra_options : function() {
    return {
      show_more_title : 'Pokaż więcej ofert'
    };
  },
  get_extra_name : function() {
   switch (this.widget_id) {
     case 3 : return 'Powierzchnia';
     case 5 : return 'Przebieg';
     default: return 'dodatkowe';
   }
  },
  draw_items : function() {

    var div = new Element('div', {'class' : 'offers'});
    div.addClass(this.options.extra_class);
    var items_count = this.items.data.length;
    for (var i = 0; i < items_count; i++) {
      var data = this.items.data[i];
      var anchor = new Element('a', {'target' : '_blank', 'href' : data['url']});
      var img_container = new Element('div', {'class' : 'widget_image'});
      var p = new Element('p', {'class' : 'description' });
      var anchor2 = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : data['name']});
      p.grab(anchor2);
      var description = new Element('p', {'class' : 'location'});
      if (data['desc']) {
        var anchor4 = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : data['desc']});
        description.grab(anchor4);
      }
      var location = new Element('p', {'class' : 'location'});
      var anchor3 = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : data['location']});
      location.grab(anchor3);
      var extra = new Element('p', {'class' : 'extra'});
      var extra_anchor = new Element('a', {'target' : '_blank', 'href' : data['url'], 'html' : this.get_extra_name() + ': '});
      var extra_text = new Element('span', {'html' : data['extra']});
      extra.grab(extra_anchor);
      extra_anchor.grab(extra_text);
      var p2 = new Element('p', {'class' : 'price', 'html' : data['value']});
      var image_loader = new Asset.image(this.items.data[i]['img'], {
        title: data['name'], 
        alt : this.items.data[i]['name'], 
        onload: function() {
          this.addClass('widget_image');
          this.replaces(img_container);
          div.getParent().tween('height', div.getHeight());
        }, 
        onerror : function() { 
          var height = div.getHeight() + p.getHeight() + location.getHeight() + size.getHeight() + p2.getHeight();
          img_container.grab(Element('img', {src : getStaticUri('/img/widgets/brakzdjecia'), 'title' : 'Brak zdjęcia', alt : 'Brak zdjęcia', height : '100'}));
          div.getParent().tween('height', height + 12);
        }
      });
      anchor.grab(img_container);
      div.adopt(anchor, p, location, description, extra, p2);
    };
    return div;
  }
});


//----------------------------------------------------- GazetaPraca WIDGET ------------------------------------------------
var GPWidget = new Class({
  Extends : Widget,
  add_extra_options : function() {
    return {
      show_more_title : 'Pokaż więcej ofert'
    };
  },
  animate : function(old_items, new_items, container, on_animation_complete) {
    container.setStyle('height', old_items.getHeight());
    new_items.setStyles({'opacity' : '0', 'position' : 'absolute'});
    old_items.setStyles({'opacity' : '1', 'position' : 'absolute'});
    container.adopt(new_items);
    old_items.set('tween', {onComplete : function() {old_items.dispose();} });
    new_items.set('tween', {onComplete : this.animation_complete.bind(this) });
    new_items.tween('opacity', 1);
    old_items.tween('opacity', 0);
    container.tween('height', new_items.getHeight());
  },
  draw_footer_ad : function() { 
    var div = new Element('div', {'class' : 'widget_footer gp_info_box'});
    var logo_div = new Element('div', {'class' : 'gp_logo_container'});
    var logo_link = new Element('a', {'target' : '_blank', 'title' : 'Kliknij aby przejść do Gazeta Praca', 'href' : ' http://gazeta.hit.gemius.pl/hitredir/id=pzM65rMP55mkkhMYr3VoT9TazdrNOo8IA_IGzJFHnpz.P7/stparam=lghnhxlngl/url=http://praca.gazetapraca.pl/0,0.html?utm_source=naszaklasa&utm_medium=AutopromoZew&utm_content=logo&utm_campaign=a_pracalogonk0909'});
    logo_link.grab(new Element('img', {'alt' : 'logo Gazeta Praca', 'src' : getStaticUri('/img/widgets/partners/gazetapraca_small')}));
    logo_div.grab(logo_link);
    var links_div = new Element('div', {'class' : 'gp_links_div'});
    links_div.adopt(new Element('a', {'text' : 'Dodaj swoje CV', 'class' : 'left', 'target' : '_blank', 'href' : 'http://gazeta.hit.gemius.pl/hitredir/id=pzM65rMP55mkkhMYr3VoT9TazdrNOo8IA_IGzJFHnpz.P7/stparam=lghnhxlngl/url=http://praca.gazetapraca.pl/0,7000,,4.html?utm_source=naszaklasa&utm_medium=AutopromoZew&utm_content=logo&utm_campaign=a_pracalogonk0909'}),
                    new Element('a', {'text' : 'Zapisz do newslettera', 'class' : 'right', 'target' : '_blank', 'href' : 'http://gazeta.hit.gemius.pl/hitredir/id=pzM65rMP55mkkhMYr3VoT9TazdrNOo8IA_IGzJFHnpz.P7/stparam=lghnhxlngl/url=http://gazetapraca.pl/gazetapraca/0,103271.html?utm_source=naszaklasa&utm_medium=AutopromoZew&utm_content=logo&utm_campaign=a_pracalogonk0909'}));
    div.adopt(logo_div, links_div);
    return div;
  },
  draw_items : function() {
    var div = new Element('div', {'class' : 'offer_list'});
    if (!this.items.data) {
      return div;
    }
    var items_count = this.items.data.length;
    for (var i = 0; i < items_count; i++) {
      var anchor = new Element('a', {'target' : '_blank', 'href' : this.items.data[i]['url']});
      if(i == items_count-1) {
        anchor.addClass('last_el');
      }
      var name = new Element('h5', {'html' : this.items.data[i]['name']});
      name.set('html', break_string(name.get('text'), 15, 5));
      var desc = new Element('p', {'html' : this.items.data[i]['desc']});
      anchor.adopt(name, desc);
      div.grab(anchor);
    };
    return div;
  }
});


//----------------------------------------------------- Przypominacz WIDGET ------------------------------------------------
var PrzypominaczWidget = new Class({
  Extends : Widget,
  add_extra_options : function() {
    return {
      show_more_title : 'wyślij prezent z pocztakwiatowa.pl',
      show_more_text : 'wyślij prezent'
    };
  },
  items_not_found_info : function() {
    var info_img = new Element('img', {'src' : getStaticUri('/img/widgets/brak_danych'), 'alt' : 'Informacja o błędzie' });
    var info_msg = new Element('p', {'class' : 'warning', 'text' : 'Brak wpisów w Twoim kalendarzu'});
    var wrapper = new Element('div', { 'class' : 'content'});
    wrapper.adopt(info_img, info_msg);
    return wrapper;
  },
  animate : function(old_items, new_items, container) {
    container.setStyle('height', old_items.getHeight());
    new_items.setStyles({'opacity' : '0', 'position' : 'absolute'});
    old_items.setStyles({'opacity' : '1', 'position' : 'absolute'});
    container.adopt(new_items);
    old_items.set('tween', {onComplete : function() {old_items.dispose();} });
    new_items.set('tween', {onComplete : this.animation_complete.bind(this) });
    new_items.tween('opacity', 1);
    old_items.tween('opacity', 0);
    container.tween('height', new_items.getHeight());
  },
  draw_items : function() {
    var div = new Element('div', {'class' : 'offers'});
    var ul = new Element('ul');
    var items_count = this.items.data.length;
    var last_item = '';
    var group_namedays = false;
    for (var i = 0; i < items_count; i++) {
      var data = this.items.data[i];
      if (last_item == '1_' +  data['location']) {
        group_namedays = true;
      } else {
        group_namedays = false;
      }
      var li = new Element('li');
      if(i == 0) {
        li.addClass('first_el');
      }
      var converter = new Element('p', {'html' : data['desc']});
      var icon =  new Element('img', {'src' : getStaticUri('/img/przypominacz_ico_' + data['value'] + ".png"), 'class' : 'przypominacz_ico'});
      var date = new Element('p', {'html' : data['location'], 'class' : 'date'});
      var name = new Element('p', {'html' : data['name'], 'class' : 'title'});
      var more_dots = (data['desc'].length > 40) ? '&hellip;' : '';
      var info = new Element('p', {'html' : data['desc'].substr( 0, 40) + more_dots, 'class' : 'description', title : converter.get('text')});
      var msg_container = new Element('div', {'class' : 'wrapper'});
      if (!group_namedays) {
        msg_container.adopt(date);
      }
      msg_container.adopt(name, info);
      li.adopt(icon, msg_container);
      if ((data['value'] == 1 || data['value'] == 2) && !group_namedays) {
        var gift_link_to_nk = new Element('a', {'href' : data['url'] ? data['url'] : '/gifts/send', 'class' : 'gift_nk', 'title' : 'Wyślij prezent wirtualny'});
        var gift_link_to_poczta = new Element('a', {'href' : 'http://www.pocztakwiatowa.pl/?code=f6bcfe7f36593ab84a802c07e476a5d8', 'target' : '_blank', 'class' : 'gift_poczta', 'title' : 'Wyślij prezent z pocztakwiatowa.pl'});
        var gift_nk = new Element('img', {'src' : getStaticUri('/img/przypominacz_gift.png')});
        var gift_poczta = new Element('img', {'src' : getStaticUri('/img/przypominacz_gift_poczta.png')});
        gift_link_to_poczta.grab(gift_poczta);
        gift_link_to_nk.grab(gift_nk);
        li.adopt(gift_link_to_nk, gift_link_to_poczta);
      };
      if (group_namedays) {
       li.addClass('next_namedays');
      }
      last_item = data['value'] + '_' + data['location'];
      ul.grab(li);
    }
    div.grab(ul);
    return div;
  }
});
