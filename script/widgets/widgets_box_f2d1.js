var WidgetsBox = new Class({
  options : {
    wrapper_id : 'widgets_box',
    api_uri    : '/okienka/api'
  },
  Implements : [Options],
  initialize : function(options) {
    this.setOptions(options);
    this.state = 0; //rozwniete
    this.widgets_data = null;
    this.widgets = new Array();
    this.widgets_count = 0;
    this.wrapper = $(this.options.wrapper_id);
    if (this.wrapper) {
      this.button = new Element('img', {'id' : 'widgets_box_showhide_btn', events : {
          click : this.toggle_visibility.bind(this)
        }});
      $extend(this.wrapper, this);
      this.wrapper.empty();
      this.wrapper.grab(new Element('div', {
        'class' : 'ajax_loading', 
        styles : {'width' : '100%', 'height' : '150px'}
      }));
      this.get_user_widgets();
      $('widgets_header_tools').grab(this.button);
    };
  },
  
  handle_error : function (error_code, error_msg) {
    var info_img = new Element('img', {'src' : getStaticUri('/img/widgets/brak_danych'), 'alt' : 'Informacja o błędzie', styles : { 'margin' : 'auto', 'display' : 'block'}});
    var info_msg = new Element('p', {'class' : 'warning', 'html' : error_msg});
    var error_msg_wrapper = new Element('div', { 'class' : 'content'});
    error_msg_wrapper.adopt(info_img, info_msg);
    this.wrapper.empty();
    this.wrapper.grab(error_msg_wrapper);
  },
  
  draw_widgets : function () {
    var widgets_list = new Element('ul', {id : 'widgets_list'});
    this.wrapper.empty();
    var widgets_count = 1;
    this.widgets_data.each(function(widget_data) {
      var factory = new WidgetFactory();
      var widget = factory.get(widget_data['type'], widget_data['id'], {
        name      : widget_data['name'],
        offset    : widget_data['offset'],
        hidden    : widget_data['hidden'],
        type      : widget_data['type'],
        more_url  : widget_data['full_offer_url'],
        wrapper   : this.wrapper,
        index     : widgets_count++
      });
      if (widget_data['items']) {
        widget.parse_items(widget_data['items']);
      }
      var widget_obj = widget.draw();
      if (this.state) {
        widget_obj.box_hide();
      }
      var offset = this.widgets.length;
      widget_obj.addEvents({
        show :  function() { this.update_visibility(); }.bind(this),
        remove : function() { this.removed_widget(widget_obj);}.bind(this)   
      });
      widgets_list.grab(widget_obj);
      this.widgets[this.widgets.length] = widget_obj;
      this.widgets_count++;
    }.bind(this));
    this.wrapper.adopt(widgets_list, new Element('div', {'class' : 'clear'}));
    this.refresh_state_btn();
  },
  removed_widget : function( widget ) {
    this.widgets.splice(this.widgets.indexOf(widget), 1);
    if (this.widgets.length == 0) {
      this.wrapper.getParent().getParent().dispose();
    }
  },

  get_user_widgets : function (widgets_ids) {
    var ajax = new Request.NK( {
      method    : 'get',
      url       : this.options.api_uri + '/get_user_widgets',
      onSuccess : function(json) {
        if (json[0] != 1) {
          this.handle_error.bind(self, [json[0], json[1]])();
        } else {
          this.widgets_data = json[1][0];
          this.state = json[1][1];
          this.draw_widgets();
        };
    }.bind(this),
    onFailure : function() {
      this.handle_error(1, 'Nie mozna połączyć z usługą');
    }.bind(this)
    }).send();
  },
  //Obsługa przytcisku
  refresh_state_btn : function() {
    if (this.state) {
      this.button.set('src', getStaticUri('/img/button_rozwin_blue.gif'));
    } else {
      this.button.set('src', getStaticUri('/img/button_zwin_blue.gif'));
    }
  },
  toggle_visibility : function() {
    if (this.state) {
      this.state = false;
      this.show_widgets();
    } else {
      this.state = true;
      this.hide_widgets();
    }
    this.refresh_state_btn();
    this.send_new_visible_state(this.state);
  },
  hide_widgets : function() {
    this.widgets.each(function(widget){
      widget.box_hide();
    });
  },
  update_visibility : function() {
    if(this.state) {
      this.widgets.each(function(widget){
        widget.hide();
      });
      this.state = false;
      this.refresh_state_btn();
    }
  },
  show_widgets : function() {
    this.widgets.each(function(widget){
      widget.show();
    });
  },
  send_new_visible_state : function (new_state) { //zmiana stanu okienka
    var ajax = new Request.NK({
      method : 'post',
      url    : this.options.api_uri + '/change_box_state/' + (new_state ? 1 : 0),
      onSuccess : function(json){
      }
    }).send();
  }
});

window.addEvent('domready_nk', function() {
  var box = new WidgetsBox();
});
