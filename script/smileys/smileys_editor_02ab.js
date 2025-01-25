/**
 * @class SmileyEditor
 */
var SmileyEditor = new Class({
  Implements: Options,    
  options: {
    iframe: {
      id: ''
    },
    smiley_path: '',
    max_content_length: 4000,
    exceptions: {
      ':/':  {
        'http':  '_d8a87d9bff82e5882578f319ac05b131',
        'https': '_e57eeb6e313834c14db557bea633de46',
        'ftp':   '_a2c8529e50a1873e959fabae462e5ebe'
      }
    },
    ignored_keycode: [9,16,17,18,20,32,33,34,35,36,37,38,39,40,45,37,39,92,144,188]
  },

  iframe: null,
  editor: null,
  counter: null,
  
  newline: '\n',
  
  smiley: new Hash(),
  current_length: 0,

  /**
   * Constructor
   * @param Objecr config - editor config
   */
  initialize: function(config)
  {
    this.setOptions(config);

    for(var type in this.options.smiley_code) {
      for(var code in this.options.smiley_code[type].smileys) {
        this.smiley[code] = this.options.smiley_code[type].smileys[code];
      }
    }

    this.regexp = new RegExp(this.smiley.getKeys().extend([this.newline]).map(function(item){ return item.escapeRegExp()}).join('|'), 'i');    

    this.iframe = $(this.options.iframe.id);
    this.iframe.removeClass('hidden');
    if(Browser.Engine.webkit || Browser.Engine.gecko) {
      this.run_init();
    } else {
      this.iframe.addEvent('load', this.run_init.bind(this));
    }
  },
  
  run_init: function()
  {
    this.init();
    this.create_toolbar();
    this.create_smiley_list();    
  },

  /**
   * Method init editor
   */
  init: function()
  {        
    this.textarea = this.iframe.getPrevious('textarea');
        
    this.editor = this.iframe.contentWindow;
    this.editor.body = $(this.editor.document.body);    

    this.add_css('body { font: normal normal normal 12px/20px Tahoma, Arial, Verdana, Sans-serif; } p { margin: 0;} img { vertical-align: middle; }');
    
    this.counter = new Element('span', {
      'text': '0/'+this.options.max_content_length,
      'class': 'smileys_counter'
    }).inject(this.iframe, 'before');
         
    if(Browser.Engine.trident) {
      this.init_ie();
      this.listener = this.editor.body;
      /** Add event used only in IE */
      this.add_event(this.listener, 'keyup', this.save_position.bind(this));
      this.add_event(this.listener, 'click', this.save_position.bind(this));
    } else {
      this.init_other();
      this.listener = this.editor;
    }

    /** Add events */
    this.add_event(this.listener, 'keyup', this.parse.bind(this));
    this.add_event(this.listener, 'keypress', this.keydown.bindWithEvent(this));
    this.add_event(this.listener, 'click', this.click.bindWithEvent(this));
    this.add_event(this.listener, 'paste', this.paste.bindWithEvent(this));    
    this.add_event(this.listener, 'drag', this.stop_event.bindWithEvent(this));
    this.add_event(this.listener, 'drop', this.stop_event.bindWithEvent(this));
    
    $(document.body).addEvent('click', this.close_smiley_list.bindWithEvent(this));
    
    this.textarea.addClass('hidden');
    this.textarea.addEvent('quote', this.quote.bind(this));
    this.textarea.getParent('div.form_row').addClass('message_edit');
    $(this.textarea.form).addEvent('submit', function(e) {      
      this.textarea.set('value', this.get_content(this.editor.body));
    }.bind(this));
        
    this.set_content(this.textarea.get('value'));    
   
  },
    
  /**
   * Method run when we clicked on editor
   */
  click: function(e)
  {
    this.close_smiley_list();
  },
  
  /**
   * Method run when we paste something to editor
   * @param Event e
   */
  paste: function(e)
  {
    
  },
  
  /**
   * Method run when content is changed
   */ 
  change: function()
  {
    if(this.counter) {
      this.counter.set('text',(this.current_length = this.get_content_length())+'/'+this.options.max_content_length);
    }
  },
  
  keydown: function(e)
  {    
    var code = e.which || e.keyCode;    
    if(Browser.Engine.presto && ((e.ctrlKey && code == 86) || (e.shiftKey && code == 45))) {
      this.paste(e);
      return;
    }
    if(this.options.max_content_length <= this.current_length) {      
      if((code == 8 || code == 37 || code == 38 || code == 39  || code == 40 || code == 46) && e.charCode == 0 ) {
        return;
      }      
      this.stop_event(e);
    }
  },

  /**
   * Method use to stop event
   */
  stop_event: function(e)
  {
    new Event(e).stop();
    return false;
  },

  /**
   * Metod use to init editow when browser is IE
   */
  init_ie: function()
  {  
    /**
     * Method find and change smileys code to image in IE
     */
    this.parse = function(e) 
    {
      if(e && this.options.ignored_keycode.indexOf(e.keyCode) != -1) {
        return;
      }

      var range = this.editor.body.createTextRange();

      range.moveToElementText(this.editor.body);
      for(var exception in this.options.exceptions) {
        for(var before in this.options.exceptions[exception]) {
          for(var i = 0; range.findText(before+exception, 1000000, 0); i++) {
            range.text = this.options.exceptions[exception][before];
            range.collapse(false);
          }
        }
      }

      range.moveToElementText(this.editor.body);
      this.smiley.each(function(data, code) {
        for(var i = 0; range.findText(code, 1000000, 0); i++) {
          range.text = '';
          range.pasteHTML('<img src="' + this.options.smiley_path + data + '" alt="'+ code +'" >');
          range.collapse(false);
        }
      }.bind(this));

      range.moveToElementText(this.editor.body);
      for(var exception in this.options.exceptions) {
        for(var before in this.options.exceptions[exception]) {
          for(var i = 0; range.findText(this.options.exceptions[exception][before], 1000000, 0); i++) {
            range.text = before + exception;
            range.collapse(false);
          }
        }
      }

      this.change();
    };

    /**
     * Method insert smiley in IE
     * @param string code - smiley code
     */
    this.insert_smiley = function(code) 
    {    
      var range = this.editor.body.createTextRange();
          range.collapse(true);
          range.moveStart('character',this.position);
          range.collapse(true);
          range.pasteHTML('<img src="' + this.options.smiley_path + this.smiley[code] + '" alt="'+ code +'" >');
          range.collapse(false);
          range.select();

      this.save_position();
      this.close_smiley_list();
      
      this.change();
    };

    /**
     * method insert quote text in IE
     * @param string text
     */
    this.quote = function(text) 
    {
      var range = this.editor.body.createTextRange();
          range.collapse(true);
          range.moveStart('character',this.position);
          range.collapse(true);
          range.pasteHTML(htmlentities(text));
          range.collapse(false);
          range.select();      
      this.parse();
      this.save_position();
      
      this.change();
    };
    
    /**
     * Method save coursor position
     */
    this.save_position = function()
    {
      if(this.editor.document.selection) {
        this.position = -1*this.editor.document.selection.createRange().moveEnd("character", -100000000);
      }
    };
    
    try {
      this.editor.focus();
    } catch(e) {}
    
    this.editor.body.contentEditable = true;
  },

  /**
   * Metod use to init editow when browser isn't IE
   */
  init_other: function()
  {  
    /**
     * Method find and change smileys code to image in other than IE browser
     * @param Event e
     * @param int offset
     */
    this.parse = function(e, offset) {
      if(e && this.options.ignored_keycode.indexOf(e.witch) != -1) {
        return;
      }

      var selection = this.editor.getSelection();
      if(selection === null) {
        return;
      }
      var range = selection.getRangeAt(0), code = null;      
      var exception_type = null, exception_hash = null, exception_node = null, exception_range = null;
      if( range.startContainer.nodeValue && (f = this.find(range.startContainer.nodeValue, this.regexp, offset || 0))) {
        if(this.options.exceptions[f.match]) {
          var exception_position = null;
          for(var exception in this.options.exceptions[f.match]) {            
            if((exception_position = range.startContainer.nodeValue.indexOf(exception+f.match)) > -1 && exception_position == f.index - exception.length) {
              this.parse(e, f.index + exception.length);
              return;
            }
          }
        }

        var d = range.startContainer.nodeValue.length - range.endOffset;
        var code = f.match.toLowerCase();
        
        if(f.match == '\n') {
          var smiley = this.editor.document.createElement('br');
        } else {
          var smiley = this.editor.document.createElement('img');
              smiley.alt = code;
              smiley.src = this.options.smiley_path + this.smiley[code];
        }
        
        range.startContainer.nodeValue = range.startContainer.nodeValue.substring(0, f.index) + range.startContainer.nodeValue.substring(f.index + f.match.length);
        range.setStart(selection.anchorNode, f.index);
        range.setEnd(selection.anchorNode, f.index);

        selection.removeAllRanges();
        selection.addRange(range);
      
        range.insertNode(smiley);
        
        try {
          range.setEnd(smiley.nextSibling, smiley.nextSibling.length - d);
          range.setStart(smiley.nextSibling, smiley.nextSibling.length - d);
        } catch(e) {}
        
        selection.removeAllRanges();
        selection.addRange(range);

        this.parse(e);
      }

      this.change();
    };
        
    this.find = function(text, regexp, offset) {
      var index, subb_length = 0, c = null;
      while(true) {
        regexp.lastIndex = 0;        
        if(c = text.match(regexp)) {
          index = text.indexOf(c[0], 0);
          if(index + subb_length >= offset) {
            return {
              'index': index + subb_length,
              'match': c[0]
            }
          } else {
            subb_length += index+c[0].length;
            text = text.substr(index+c[0].length);
          }
        } else {
          return null;
        }
      };
    };

    /**
     * Method insert smiley in other than IE browser
     * @param code - smiley code
     */
    this.insert_smiley = function(code) 
    {
      this.editor.focus();

      var smiley = this.editor.document.createElement('img');
          smiley.alt = code;
          smiley.src = this.options.smiley_path + this.smiley[code];

      var selection = this.editor.getSelection();
          selection.getRangeAt(0).insertNode(smiley);

      var range = this.editor.document.createRange();
          range.setStartAfter(smiley);
          range.setEndAfter(smiley);

      selection.removeAllRanges();
      selection.addRange(range);
            
      this.editor.focus();
      this.close_smiley_list();
      
      this.change();
    };

    /**
     * Method insert quote text in other than IE browser
     * @param string text
     */
    this.quote = function(text) {
      this.editor.focus();

      var quote = this.editor.document.createTextNode(text), selection = this.editor.getSelection(), range = this.editor.document.createRange();

      selection.getRangeAt(0).insertNode(quote);
      
      range.setStart(quote, quote.nodeValue.length);
      range.setEnd(quote, quote.nodeValue.length);
      
      selection.removeAllRanges();
      selection.addRange(range);

      this.parse();      
      this.change();
    };    

    try {
      this.iframe.focus();
    } catch(e) {}
    
    this.editor.document.designMode = "on";
    this.editor.document.execCommand("undo", false, null);
  },
  
  /**
   * Method create toolbar
   */
  create_toolbar: function()
  {
    this.toolbar = new Element('div',
      {
        'id': 'smileys_toggle'
      }
    );
    this.toolbar.button = new Element('span',
      {
        'class': 'toggle',
        'text': 'Wstaw minkę',
        'events': {
          'click': this.toggle_smiley_list.bindWithEvent(this)
        }
      }
    ).inject(this.toolbar);

    this.toolbar.inject(this.iframe, 'before');
  },

  /**
   * Method create smileys list window
   */
  create_smiley_list: function()
  {
    this.list = new Element('div',
      {
        'id': 'smileys_popup',
        'styles': {
          'display': 'none'
        },
        'events': {
          'click': function(e) {
            e.stop();
          }
        }
      }
    ).inject(this.toolbar);
    
    this.rebuild_smiley_list();
  },
  
  rebuild_smiley_list: function()
  {
    this.list.empty();
    
    new Hash(this.options.smiley_code).each(
      function(data, key, categories_array)
      {
        var show_paid = data.is_paid == 0 || (data.is_paid == 1 && this.options.show_paid_smileys_to_current_user);
        var category = new Element('div',
          {
            'class': (show_paid ? 'category' : 'category_paid more') + (key == categories_array.getKeys().getLast() ? ' last' : '')
          }
        ).grab( new Element('span',
          {
            'text': key + ':',
            'class': 'category_name'
          })
        ).inject(this.list);

        var list = new Element('ul',
          { 'events': 
            {
              'click': show_paid ? $empty : this.go_pay.bind(this)
            }
          }
        ).inject(category);

        new Hash(data.smileys).each(
          function(item, code)
          {
            if(show_paid) {
              new Element('li').grab(new Element('img',
                {
                  'alt': code,
                  'src': this.options.smiley_path + this.smiley[code],
                  'title': code,
                  'events': {
                    'click': this.insert_smiley.bind(this, code)
                  }
                }
              )).inject(list);
            } else {
              new Element('li').grab(new Element('img',
                {
                  'alt': code,
                  'src': this.options.smiley_path + this.smiley[code],
                  'title': this.options.smileys_paid_icon_title
                }
              )).inject(list);
            }
          }.bind(this)
        );
        
      }.bind(this)
    );    
  },

  /**
   * Method close smilelist window
   */
  close_smiley_list: function(e)
  {    
    this.list.setStyle('display', 'none');
    this.toolbar.button.removeClass('open');
  },

  /**
   * Method toogle smilelist window
   */
  toggle_smiley_list: function(e)
  {
    e.stopPropagation();
    this.toolbar.button.toggleClass('open');
    this.list.setStyle('display', this.list.getStyle('display') === 'block' ? 'none' : 'block');   
  },

  /**
   * Method set content to editor
   * @param string content
   */
  set_content: function(content)
  {
    if(content.length) {
      this.editor.body.set('text', content);
      
      if(this.editor.body.childNodes[0]) {
        if(!Browser.Engine.trident) {
          var range = this.editor.document.createRange();         
              range.setEnd(this.editor.body.childNodes[0], this.editor.body.childNodes[0].nodeValue.length);
              range.setStart(this.editor.body.childNodes[0], this.editor.body.childNodes[0].nodeValue.length);
          var selection = this.editor.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
        }
        this.parse();
      }
    }
  },
  
  /**
   * Method get content from editor
   * @return string - content
   */
  get_content: function(node)
  {
    var content = '';

    for(var i=0; i< node.childNodes.length; i++) {
      if(node.childNodes[i].nodeType == 3) {
        content += node.childNodes[i].nodeValue;
      } else {
        switch(node.childNodes[i].nodeName.toLowerCase())
        {
          case 'p':
            content += this.get_content(node.childNodes[i]) + this.newline;
            break;
          case 'br':
            content += this.newline;
            break;
          case 'img':
            content += node.childNodes[i].alt;
            break;
          case 'script':
            break;
          default:            
            content += $(node.childNodes[i]).get('text');
        }
      }
    }
    
    return content;
  },

  /**
   * Method calculate length of content
   * @return int - content of content in editor
   */
  get_content_length: function()
  {
    if(this.editor.body.childNodes.length == 1 && this.editor.body.childNodes[0].tagName == 'BR') {
      return 0;
    }
    
    return this.get_content(this.editor.body).length;
  },
  
  /**
   * Method add CSS to iframe
   */
  add_css: function(rules)
  {    
    var style = this.editor.document.createElement('style');
        style.type = 'text/css';
        
    if(style.styleSheet) {
      style.styleSheet.cssText = rules;
    } else {
      style.appendChild(this.editor.document.createTextNode(rules));
    }

    this.editor.document.getElementsByTagName('head')[0].appendChild(style);
  },
  
  /**
   * Method add event to element
   */
  add_event: function(element, event, _function)
  {
    if(Browser.Engine.trident) {
      element.attachEvent('on'+event,_function);
    } else {
      element.addEventListener(event,_function, true);
    }
  },
    
  refresh_show_paid_smileys_option : function ()
  {
    var that = this;
    new Request.NK({
      url : '/minki_ajax',
      method : 'get',
      onSuccess : function (responseJSON, responseText) {
        that.options.show_paid_smileys_to_current_user = responseJSON;
        that.rebuild_smiley_list();
      }
    }).send();
  },
  
  go_pay: function()
  {
    var that = this;
    var popup = new Popup({
      'title'   : 'Informacja',
      'content' : this.options.smileys_pay_message,
      'buttons' : [{'label' : 'Ok', 'close' : true}],
      'width'   : 500,
      'height'  : 300
    }).addEvent('close', function () {
      that.refresh_show_paid_smileys_option();
    });
    new MootoolsMisc().open_window('/portfel/minki_popup', 'MinkiPlatnosc', 807, 700);
  }
});
