var BlinkingTabClass = new Class({
  Extends : TabUpdater,
  //updater 
  onUpdate : function() {
  },
  onChange : function() {
    this.redrawInboxLink();
    this.printBtabBox();
  },
  isDataChanged : function(data) {
    return this.local.data.mail_id != data.mail_id || this.local.data.unread_count != data.unread_count;
  },
  //btab
  div_id : 'blinking_tab_box_content' ,
  interval_id : null,
  handleResponse : function(response) {
    //gdy mail_id odpowiedzi jest inny niz na wszystkich tabach i nie ma focusa na zadnym oknie z NK. dodatkowy warunek na ilosc maili zeby nie mrugalo przy usuwaniu
    if(this.local.data.mail_id != response.mail_id && this.local.data.content <= response.content && !NkWindow.is_focused()) {
      //ustawiamy na tym oknie blink
      this.setBlink();     
    }
    //ustawiamy nowy mail_id po to zeby wszystkie taby sobie odswiezyly mail_id, zawsze nadpisujemy zeby ustawic nowy timestamp.
    this.set(response);
  }, 
  redrawInboxLink : function() {
    if(!this.local) return;
    var el = $('mailbox_inbox_link');
    if(!el) {
      return;
    }
    var li = $('mailbox_inbox_li');    
    el.erase('html');
    if(this.local.data.unread_count.toInt() === 0) {
      el.set('html', 'Skrzynka odbiorcza');
      li.set('class', '');
    } else {
      el.grab(new Element('img', {
        'class' : 'gotmail',
        'alt' : 'Nowe wiadomości',
        'src' : getStaticUri('/img/ico_unread.gif')
      }));
      el.appendText(' Skrzynka odbiorcza ');
      el.grab(new Element('span', {
        'class' : 'small',
        'text' : '(' + this.local.data.unread_count + ')'
      }));
      li.set('class', 'nowe_wiadomosci');
    }
  },
  printBtabBox : function() {
      if(this.only_mails_count || !this.local) {
        return;
      }
      // tworzymy box tylko w przypadku gdy lista nowych maili jest niepusta
      if (this.local.data.mail_id > 0) {
        // pobieramy wyrenderowanego maila
        this.mail_request.resetData();
        this.mail_request.method = 'GET';
        this.mail_request.requestFile = '/new_messages_get_mail/'+ this.local.data.mail_id;
        this.mail_request.runAJAX();
      } else {
        this.eraseBtabBox();
      }
  } ,
  eraseBtabBox : function() {
    var box = $(this.div_id);
    if (!this.only_mails_count) {
      box.erase('html');
      box.setStyle('display', 'none');
      this.redrawMailbox();
    }
  },
  initialize : function(only_mails_count) {
    this.only_mails_count = only_mails_count;
    this.parent('btab_' + nk_options.btab.uid);
    this.page_title = document.title;
    this.refresh_interval = nk_options.btab.refresh_interval;
    this.blink_interval = nk_options.btab.blink_interval;
    //randomizacja ttla
    var cache_ttl = nk_options.btab.cache_ttl.toInt();
    var rand_var = Math.floor(cache_ttl/5*Math.random()-cache_ttl/10);
    this.cache_ttl = cache_ttl + rand_var.toInt();
    var that = this;
    $(window).addEvent('focus', that.clearBlink.bind(this));
    $(document).addEvent('focus', that.clearBlink.bind(this));
    this.request = new sack();
    this.request.onCompletion = function() {
      response = JSON.decode(that.request.response);
      if(!response) {
        return;
      }
      if(response.status == 'OK') {
        //top
        if(response.code == 1) {
          $(window).fireEvent('new_mails',response.unread_count);
          that.handleResponse(response);
          that.redrawInboxLink();
          that.printBtabBox();
        }
        //dispose
        if(response.code == 2) {
          that.topRequest(true);
        } 
      } else if(response.status == 'ERROR') {
        if (this.local) {
          that.printBtabBox();
        } else {
          that.eraseBtabBox();
        }
      } 
    }
    this.mail_request = new sack();
    this.mail_request.method = 'GET';
    this.mail_request.onCompletion = function() {
      response = JSON.decode(that.mail_request.response);
      that.eraseBtabBox();
      if (!response || !response.mail) {
        return;
      }
      var btab_box = $(that.div_id); 
      //dodajemy do domu otrzymanego maila
      btab_box.set('html', response.mail);
      //dodajemy do placeholdera liczbe maili
      $('btab_count_placeholder').set('html', that.local.data.content.toInt());
      //ustawiamy avatara
      btab_box.getElement('div.avatar_no_js').setStyle('display','none');
      var avatar = $(that.div_id).getElement('div.avatar').setStyle('display','block');
      
      var avatar_options = avatar.getElement('div.avatar_options ul');
      if(avatar_options && avatar_options.getElements('li').length < 2) {
        avatar.getElement('div.avatar_arrow').addClass('disabled');
      }
      
      Avatar.set_avatar_events(avatar);
      var _that = that;
      $('dispose_mail').addEvent('click', function() {
        _that.disposeAction();
      });
      $('dispose_mail2').addEvent('click', function() {
        _that.disposeAction();
      });
      btab_box.setStyle('display', 'block');
      that.redrawMailbox();
      
      $(window).fireEvent('new_mails', that.local.data.unread_count.toInt());
    };
  },
  disposeAction : function() {
    this.request.resetData();
    this.request.method = 'GET';
    var chkbox = $('mark_as_read');
    if(chkbox && chkbox.get('checked')) {
      this.request.requestFile = '/new_messages_json/mark_dispose/' + this.local.data.mail_id;
    } else {
      this.request.requestFile = '/new_messages_json/dispose/' + this.local.data.mail_id;
    }
    this.request.runAJAX();
  },
  setRequestsLoop : function() {
    this.topRequest(true);
    this.topRequest.periodical(this.refresh_interval,this);
  },
  topRequest : function(force) {
    force = force || false;
    //staramy sie nie robic tego zbyt czesto wzgledem wszystkich tabow
    if ((new Date()).getTime() > this.local.timestamp + this.cache_ttl || force) {
      this.request.resetData();
      this.request.method = 'GET';
      this.request.requestFile = '/new_messages_json/top/' + this.only_mails_count;
      this.request.runAJAX();
    } else {
      //wypisujemy box uzywajac lokalnych danych
      this.redrawInboxLink();
      this.printBtabBox();
    }
  },
  setBlink : function() {
    if(this.interval_id != null) {
      return;
    }
    var that = this;
    this.interval_id = this.blink.periodical(this.blink_interval, this);
  },
  clearBlink : function() {
    document.title = this.page_title;
    this.interval_id  = $clear(this.interval_id);
  },
  blink : function() {
    document.title = document.title == this.page_title ? 'Nowe wiadomości(' + this.local.data.content.toInt() + ')' : this.page_title;
  },
  separateMailbox : function() {
    $('mailbox_short').set('src', getStaticUri('/img/joinbottom.gif'));
    $('mailbox_extended').set('src', getStaticUri('/img/jointop.gif'));     
  },
  joinMailbox : function() {
    $('mailbox_short').set('src', getStaticUri('/img/join.gif'));
    $('mailbox_extended').set('src', getStaticUri('/img/join.gif')); 
  },
  redrawMailbox : function() {
    var btab_box = $(this.div_id); 
    if( btab_box && btab_box.get('html')) {
      this.separateMailbox();  
    } else {
      if ($('mail_max').getStyle('display') != 'none') {
        this.joinMailbox();
      } else {
        this.separateMailbox();
      }
    }
  }
});

var Btab ;

$(window).addEvent('domready_nk', function() {
  Btab = new BlinkingTabClass($('blinking_tab_box_content') ? 0 : 1);
  Btab.setLoop();
  Btab.setRequestsLoop();
  if(Btab.local && Btab.local.data) {
    $(window).fireEvent('new_mails', Btab.local.data.unread_count.toInt());
  }
  
  if ($('mailbox_inbox_link')) {
    $('mail_minmax_button').addEvent('click', function() {
      xbox.toogle(xbox.mail);
      Btab.redrawMailbox();
    });
  }
});
