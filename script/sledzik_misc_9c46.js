/******************************************************************/
/*           Implementacja nowych method klasy Element            */
/******************************************************************/
Element.implement({
  getModifyHeight: function() {
    var that = this;
    var value = 0;
    var height = this.getHeight();
    
    if( height == 0) {
      return 0;
    }
    
    ['padding-top','padding-bottom','border-top','border-bottom'].each(function(style) {
        value += Math.abs(that.getStyle(style).toInt());
    });
    return  height - value;
  },
  
  getModifyWidth: function() {
    var that = this;
    var value = 0;
    var width = this.getWidth();
    
    if( width == 0) {
      return 0;
    }
    
    ['padding-left','padding-right','border-left','border-right'].each(function(style) {
        value += Math.abs(that.getStyle(style).toInt());
    });
    return  width - value;
  },
  
  /** 
   * Funkcja płynnie podmienia element DOM-a na inny
   * 
   * @param Element {block} - nowy kontent
   * @param Object {params} - parametry
   */
  fx_replaces: function(block, params){
    var options = {
      duration: 400,
      clone_events: true,
      onStart: $empty,
      onComplete: $empty
    };
    
    options = $extend(options, params);
    
    this.set('morph', {
      duration: options.duration,
      onStart: options.onStart,
      onComplete: function() {
        var old_width = this.element.getModifyWidth();
        var old_height = this.element.getModifyHeight();
        var old_overfolow = this.element.getStyle('overflow');
        if(options.clone_events) {
          block.cloneEvents(this.element);
        }
        
        block.setStyles({
          'width': options.width ? options.width : old_width,
          'display': this.element.getStyle('display'),
          'opacity': 0,
          'overflow': 'hidden',
          'position': 'absolute'
        });
        
        this.element.getParent().grab(block);        
        var new_height = block.getModifyHeight();
                  
        block.dispose().setStyles({'height': old_height, 'position': ''}).replaces(this.element);
        block.set('morph', {
          duration: options.duration ,
          onComplete: function() {
            this.element.setStyle('overflow', old_overfolow);
            options.onComplete(this.element);
          }
        }).morph({opacity: 1, height: new_height});
      }
    });
    
    if(this.getModifyHeight() == 0 ) {
      var morph = this.get('morph');
          morph.onStart();
          morph.onComplete();
    } else {
      this.morph({ opacity: 0 });
    }
  }, 

  /**
   * Funkcja płynnie wstawia obiekt w kontener
   *
   * @param Element {contener} - kontener w kótry zostaniw wstawiony element
   * @param Object {params} - dodatkowe parametry
   */
  fx_inject: function(contener,param) {
    var options = {
        where: 'bottom',
        duration: 400,
        onStart: $empty,
        onComplete: $empty
    };
    options = $extend(options,param);
    
    this.setStyle('height','auto');
    this.inject(contener, options.where);
    var height = this.getModifyHeight();
    this.setStyles(
      {
        'height': 0,
        'opacity':0,
        'overflow':'hidden'
      }
    );
    this.set(
      'morph',
      {
        duration: options.duration,
        onStart: options.onStart,
        onComplete: function() {
          this.element.setStyle('height','');
          options.onComplete();
        }
      }
    );
    this.morph(
      {
        'height': height, 
        'opacity':1
      }
    );
  }, 
  
  /**
   * Funkcja plynnie usowa element z DOM-a
   *
   * @param Obejct {params} - parametry
   */
  fx_dispose: function(params) {
    this.set(
      'morph',
      {
        duration: params && params.duration ? params.duration : 400,
        onStart: function() {
          this.element.setStyle('overflow','hidden');
        },
        onComplete: function() {
          var block = this.element.dispose();
          if(params && params.onComplete) {
            params.onComplete(block);
          }
        }
      }
    );
    this.morph(
      {
        'height': 0, 
        'opacity': 0
      }
    );
  }
  
});

Element.NK = function() 
{
  if(arguments.length == 0) return null;
  
  var args = arguments[0] || {}, element = null, elements = null, siblings = null;
  
  if(args.constructor == String) {
    if(arguments.length > 1) {      
      attributes = arguments[1];
      if(attributes.constructor == String) {
        element = document.createTextNode(args);
        elements = [];
        elements.push(element);                
        siblings = Element.NK.apply(null, Array.prototype.slice.call(arguments,1));
        if(siblings) {
          elements = elements.concat(siblings);
        }
        return elements;
      } else {
        element = new Element(args,attributes);        
        var children = Element.NK.apply(null, arguments[2] || []);
        if(children) {
          element.adopt(children);
        }
        if(arguments.length > 3) {
          siblings = Element.NK.apply(null, Array.prototype.slice.call(arguments,3));
          return [element].concat(siblings);
        }
        return element;
      }      
    } else {
      return document.createTextNode(args);
    }
  } else {
    if(arguments.length > 1) {      
      var children = Element.NK.apply(null, Array.prototype.slice.call(arguments,1));
      if(children) {
        args.adopt(children);
      }
      return args;
    } else {
      return args;
    }    
  }
};

var AjaxYesNoPageHandler = new Class({
  box: null,
  Implements : [Options],
  options : {
    onNo: $empty,
    onYes: $empty,
    use_ajax: true,
    popup_options: {
      'width': 340,
      'title': 'Potwierdzenie',
      'content_safe_mode': false
    }
  },
  
  initialize: function(url,options) 
  {
    var that = this;
    this.setOptions(options);
    
    this.popup = new Popup($extend({
        'content': PopupConfig.loading
    },this.options.popup_options));
     
    new Request.NK(
      {
        url: url+'/js/get',
        method: 'get',
        onSuccess: function(result) {
          this.popup.update({'content': result.CONTENT, position: null});
          if(!this.options.use_ajax) {
            this.popup.box.contener.getElements('form').each(function(item) {
              item.set('action', item.get('action').replace(/\/js/,''));
            });
            return;
          }
          var forms = this.popup.box.contener.getElements('form');
          if(2 == forms.length){
            new AjaxForm(
              forms[0],
              {
                auto_js: false,
                onSuccess: function(response) {
                  this.popup.close();
                  if(response.STATUS == 'OK') 
                    this.options.onYes(response);
                  else {
                    this.popup.update({'title':'Błąd', 'content':'Wystąpił błąd.', 'position': null, 'buttons':[{'label':'OK'}]});
                  }
                }.bind(this),
                
                onFailure: function(msg) {
                  this.popup.update({'title':'Błąd', 'content':msg, 'position': null, 'buttons':[{'label':'OK'}]});
                }.bind(this)
              }
            );
          }
          new AjaxForm(
            forms[1],
            {
              isValid: function() {
                this.popup.close();
                this.options.onNo();
                return false;
              }.bind(this)
            }
          );
          
        }.bind(this),
        
        onFailure: function(msg) {
          this.popup.update(
            {
              'title': 'Błąd', 
              'content': PopupConfig.ajax_error ,
              'position': null,
              'buttons':[{'label':'OK'}]
            }
          );
        }.bind(this)
      }
    ).send();
  }
});
