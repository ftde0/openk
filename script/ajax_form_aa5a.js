var AjaxForm = new Class({
  options : {
    data: {},
    auto_js: true,
    action: null,
    confirm: null,
    isValid: $lambda(true),
    beforeRequest: $empty,
    onRequest: $empty,
    onSuccess: $empty,
    onFailure: $empty
  },
  
  request: null, 
  
  initialize : function(form, options) {
    this.options = $extend(this.options,options);
    
    if((this.form = $(form)) == null) {
      return false;
    }
    
    this.form.addEvent(
      'submit',
      function(event) {
        event.stop();
        if(this.options.isValid()) {
          this.options.beforeRequest();
          if(this.options.confirm) {
            new Popup({
              title: this.options.confirm.title || 'Potwierdzanie',
              content: this.options.confirm.text,
              content_safe_mode: false,
              buttons: [
                {
                  label: 'Tak',
                  onClick: this.send.bind(this)
                },
                {
                  'label': 'Nie'
                }
              ]
            });
          } else {
            this.send();
          }
        }
      }.bind(this)
    );
    
    this.request = new Request.NK(
      {        
        url: ((this.options.action ? this.options.action : this.form.get('action')) + (this.options.auto_js ? '/js' : '')),
        onRequest: this.options.onRequest.bind(this),
        
        onSuccess: function(response) {
          if(response.STATUS == 'OK') {
            this.options.onSuccess(response);
          } else if(response.STATUS == 'ERROR' || response.STATUS == 'FAILED') {
            if ($type(response.RESPONSE.FORM_ERRORS) == 'array' && response.RESPONSE.FORM_ERRORS.length) {
              if (response.RESPONSE.FORM_ERRORS.length == 1) {
                this.options.onFailure(response.RESPONSE.FORM_ERRORS[0]);
              }
              else {
                var Elem_tmp = new Element('ul', {'class': 'popup_form_errors'});
                for (var i=0; i<response.RESPONSE.FORM_ERRORS.length; i++) {
                  new Element('li',{'text': response.RESPONSE.FORM_ERRORS[i]}).inject(Elem_tmp);
                }
                this.options.onFailure(Elem_tmp);
              }
            }
            else {
              this.options.onFailure(response.RESPONSE.MSG);
            }
          }
        }.bind(this),
        
        onFailure: function() {
          this.options.onFailure(PopupConfig.ajax_error);
        }.bind(this),
        
        onException: this.options.onFailure.bind(this)
      }
    );
  },
  
  send: function() 
  {   
    this.request.send(this.form.toQueryString());
  }  
});

var AjaxFormPopup = new Class({
  options: {    
    title: null,
    popup: {},
    action: null,
    ticket: null,    
    use_ajax_form: true,
    onRequest: $empty,
    onSuccess: $empty,
    onFailure: $empty,
    quite_mode: false
  },
  
  initialize: function(options) {
    this.options = $extend(this.options,options);
    
    this.popup = new Popup({
      title: 'Ładowanie',
      content: PopupConfig.loading,
      content_safe_mode: false
    });
    
    new Request.NK({
      url: this.options.action + '/js/get/' + this.options.ticket,
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          this.popup.update($extend({
            width: 340,
            title: this.options.title,
            position: null,
            content: response.RESPONSE.CONTENT
          },this.options.popup));
          
          if(this.options.use_ajax_form) {
            var form = new AjaxForm(
              this.popup.box.getElement('form'),
              {
                action: this.options.action,
                onSuccess: function(response) {
                  this.options.onSuccess(response),
                  this.popup.close();
                }.bind(this),
                onFailure: function(msg) {
                  this.options.onFailure(msg);
                  this.popup.close();
                }.bind(this)
              }
            );
            
            this.popup.addEvent('close', form.request.cancel.bind(form.request));
          }
          
          var no_button = $('not_button');
          if(no_button) {
            no_button.onclick = function () {
              this.popup.close();
              return false;
            }.bind(this);
          }
        } else {
          this.options.onFailure(PopupConfig.ajax_error);
        }
      }.bind(this),
      
      onFailure: function() {
        if (this.options.quite_mode) {
          this.options.onFailure();
        } else {
          this.popup.update({
            title: 'Błąd',
            content: PopupConfig.ajax_error,
            buttons: [{label: 'Ok', onClick: this.options.onFailure }]
          });
        }
      }.bind(this)
      
    }).send();
    
    return false;
  }
});

/*
 * @deprecated you shoud use AjaxFormPopup
 */  
var FormPopup = function (infobox, form_id, link, ticket, onSuccess, onFail, onOtherError, use_ajax_form) {
  var _this = this;
  this.link = link;
  this.form_id = form_id;
  this.ticket = ticket;
  this.use_ajax_form = use_ajax_form;
  this.box = infobox;

  this.onSuccess = onSuccess;

  if( onFail != null ) {
    this.onFail = onFail;
  } else {
    this.onFail = function (res) {
      _this.box.show(res.CONTENT);
      var Button = document.getElementById('not_button');
      if( Button != null ){
        Button.onclick = function () {
          _this.box.close_window();
          return false;
        };
      }
    };
  }

  if( onOtherError != null ) {
    this.onOtherError = onOtherError;
  } else {
    this.onOtherError = function () {
      $log('on other');
      _this.box.show('<p>Wystąpił błąd. Przepraszamy.</p><br><p>Odśwież stronę i zaloguj się na nowo.</p>');
    };
  }

  var FormSack = new sack(_this.link + '/js/get/' + _this.ticket);
  FormSack.onCompletion = function () {
    try{
      var ret = this.parseResponse();
      if(typeof(ret) == "object" && ret.STATUS) {
        if(ret.STATUS == 'OK') {
          _this.box.show(ret.RESPONSE.CONTENT);
          if( _this.use_ajax_form ) {
            var form = new AjaxForm(
              _this.form_id,
              {
                action: _this.link,
                onSuccess: function(response) {
                  _this.onSuccess(response.RESPONSE);
                },
                onFailure: function(msg) {
                  _this.onFail({CONTENT: msg});
                }
              }
            );
            _this.box.add_on_close_event(form.request.cancel.bind(form.request));
          }
          var Button = document.getElementById('not_button');
          if(Button != null) {
            Button.onclick = function () {
              _this.box.close_window();
              return false;
            };
          }
        } else if( ret.STATUS == 'NOT_VALID' ) {
          _this.box.show('<p>Wystąpił błąd. Przepraszamy.</p><br><p>Odśwież stronę i spróbuj ponownie.</p>');
        } else {
          _this.onOtherError();
        }
      } else {
        _this.onOtherError();
      }
    } catch(e) {
      _this.onOtherError();
    }
  };
  FormSack.onError = function() {
    _this.onOtherError();
  };
  FormSack.method = 'GET';
  this.box.add_on_close_event(function(){
    FormSack.xmlhttp.abort();
    FormSack.reset();
  });
  this.box.show('<div class="loading_container"></div>');
  FormSack.runAJAX();

  return false;
};
