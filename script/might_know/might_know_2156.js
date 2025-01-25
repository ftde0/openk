var MightKnow = new function() {
  this.ajax = new sack();  
  this.avatar = new MightKnowAvatar();
  this.config = null;
  this.contener = null;
  this.no_proposition_show = false;

  this.width_box = 192;
  this.height_box = 200;


  this.is_run = false;
  this.position_in_box = 0;

  var that = this;

  /**
   * Method run on load page
   */
  this.onload = function () {
    this.config = nk_options.might_know;
    this.invite_ticket = AVATAR_SETTINGS.invite_ticket;
    this.box = $('might_know_box');
    this.contener = $('might_know_contener');  
    this.download();
  };

  /**
   * Method used when click on proposition as unwanted
   * 
   */
  this.set_as_unwanted = function(id) {

    if(this.is_run == false) {      
      this.set_wait_status(id,true);
      this.ajax.use_tickets = true;
      this.ajax.method = 'POST';
      this.ajax.requestFile = '/might_know/unwanted/'+id;   

      this.ajax.onCompletion = function() {
        that.remove_and_add(id);
      };

      this.is_run = true;
      this.ajax.runAJAX();
    }
  };

  /**
   * Method used whe we clicked on add friend button
   * 
   * @param int id - id invite friend
   */
  this.invite_friend = function(id) {

    if(this.is_run == false) {
      var box = $('might_know_avatar_'+id);

      this.set_wait_status(id,true);
      this.ajax.method = 'POST';
      this.ajax.use_tickets = false;
      this.ajax.setVar('t',this.invite_ticket);
      this.ajax.requestFile = '/invite/'+id+'/might_know_box';

      this.ajax.onCompletion = function() {
        var res = this.parseResponse();
        var message;
        if(res) {
          switch(res.ERROR) {
            case 0:
              message = "Zaproszenie <br>zostało wysłane";
              break;
            case 1:
              message = 'Musisz być zalogowany';
              break;
            case 4:
              message = 'Zaproszenie zostało<br>już wczesniej wysłane';
              break;
            case 32:
              message = 'Nie możesz zaprosić<br>samego siebie';
              break;
            case 128:
              message = 'Użytkownik nie akceptuje<br/>zaproszeń od kont<br>fikcyjnych';
              break;
              
            default:
              message = 'Błąd nieznany ('+res.ERROR+')';
          }
        } else {
          message = 'Nie można chwilowo zapraszać znajomych... <br> Spróbuj za chwilę.';
        }

        that.change_box(
          box, 
          new MightKnowInfoBox().render(message), 
          function() { 
            setTimeout( 
              function() {
                that.remove_and_add(id);
              }, 
              that.config.message_time
            ); 
          }
        );
      };

      this.ajax.onError = function() {
        that.change_box(
          box, 
          new MightKnowInfoBox().render('Bład zapytania.<br/>Spróbuj później...'), 
          function() { 
            setTimeout( 
              function() {
                that.remove_and_add(id);
              } , 
              that.config.message_time
            ); 
          }
        );
        that.set_wait_status(id,false);
      };

      this.is_run = true;
      this.ajax.runAJAX();
    }
  };

  /** 
   * Method remove one element and add new random element on end list
   * 
   * @param int remove id - box id who shoud be remove   
   */
  this.remove_and_add = function (remove_id) { 
    var box = $('might_know_avatar_'+remove_id);
    box.setStyle('overflow','hidden');
    box.set(
      'morph', 
      { 
        duration: that.config.change_box_duration, 
        onComplete: function(){ 
          box.dispose();                                                        
          if(that.position_in_box == 0) {
            that.hide_box();
          }
        } 
      }
    );
    box.morph({'opacity': -1, 'width': 0});

    if(that.users_info.length > 0) {
      var id = that.random_proposition();
      var avatar = that.avatar.render(that.users_info[id]);          
      avatar.setStyle('overflow','hidden');
      avatar.setStyle('width',0);
      setTimeout(
        function() { 
          that.add_proposition(avatar); 
        },
        that.config.change_box_duration/10
      );
      that.remove_proposition(id);
    } else {
      if(that.no_proposition_show == false) {
        var box1 = that.no_proposition();
        box1.set(
          'morph', 
          { 
            duration: that.config.change_box_duration, 
            onStart: function() {
              that.contener.grab(box1);
            },
            onComplete: function() { 
              that.is_run = false; 
            }    
          }
        );
        box1.morph({'opacity': [0, 1]});
        that.no_proposition_show = true;
      } else {
        that.is_run = false;
      }
      this.position_in_box--;
    }
  };

  /**
   * Method run to download data from database
   * 
   */
  this.download = function() {
    this.ajax.requestFile = '/might_know/listJSON/'+this.config.version;
    this.ajax.method = 'GET'; 

    this.ajax.onCompletion = function() {

      var data = this.parseResponse();

      var flags = new Array('UID','SEX','FIRST_NAME','LAST_NAME','AVATAR','FRIENDS_COUNT','CITY','RANK','ARTIFICIALITY','SOURCE','LINK');
      that.users_info=new Array();

      if(data.UID) {
        for(var i=data.UID.length; i--;){
          that.users_info[i]={};
        }

        for(var f in flags ){
          var flag=flags[f];
          if(data[flag]) {
            var tmp=data[flag];
            for(var i=tmp.length; i--;){
              that.users_info[i][flag]=tmp[i];
            }
          }
        }
      }
      if(that.users_info.length>0) {
        that.download_complete();
      } else {
        that.hide_box();
      }
    };

    this.ajax.onError = function() {     
      that.hide_box();
    };

    this.ajax.runAJAX();
  };

  /**
   * Method run on download data complete
   * 
   */
  this.download_complete = function() {

    this.contener.set(
      'morph',
      { 
        duration: 300, 
        onComplete: function(){ 
          that.contener.innerHTML = '';
          that.contener.set(
            'morph', 
            {
              duration: that.config.change_content_duration 
            }
          );
          for(var i=0; i<3; i++) {
            if(that.users_info.length > 0) {
              var id = that.random_proposition();
              that.contener.grab(that.avatar.render(that.users_info[id]));
              that.remove_proposition(id);
              that.position_in_box ++;
            } else {
              that.contener.grab(that.no_proposition());
              that.no_proposition_show = true;
              break;
            }      
          }
          that.contener.morph({'opacity': 1});
        }
      }
    );
    this.contener.morph({'opacity': 0});
  };

  /**
   * Method random id of element from list
   * 
   * @return int
   */
  this.random_proposition = function() {
    var sum = 0;
    for(var i=this.users_info.length;i--;){
      sum+=this.users_info[i].RANK;
    }
    var r=parseInt(Math.random()*(sum-1));
    sum = 0;
    for(var i=this.users_info.length;i--;){
      sum+=this.users_info[i].RANK;
      if(sum>=r){
        return i;
      }
    }
    return 0;
  };

  /**
   * Method remove from this.users_info array position id
   * 
   * @param int id - position element to remove  
   */
  this.remove_proposition = function(id) {
    this.users_info.splice(id,1);
  };

  /**
   * Method add proposition to box with animation
   *  
   * @param Element box - added box
   */
  this.add_proposition = function(box) {
    box.setStyle('width',0);
    box.set(
      'morph',
      { 
        duration: this.config.change_box_duration, 
        onStart: function(){ 
          that.contener.grab(box);
        }, 
        onComplete: function(){ 
          box.setStyle('overflow','visible'); 
          that.is_run = false; 
        } 
      }
    );
    box.morph({'opacity': [0, 1], 'width': this.width_box});
  };

  /**
   *  Method remove content from box1, insert box2 to box1 and on end run onChangeComplete
   *  
   *  @param Element box1 - element to copy content
   *  @param Element box2 - element from copy content
   *  @param Function onChangeComplet - function run on move data complete   
   */
  this.change_box = function (box1, box2, onChangeComplete ) {
    box1.set(
      'morph',{
        duration: this.config.change_content_duration, 
        onComplete: function(){ 
          box1.set(
            'morph',
            {
              duration: that.config.change_content_duration, 
              onComplete: onChangeComplete 
            }
          );
          box1.innerHTML = ''; 
          box1.grab(box2); 
          box1.morph({'opacity': 1}); 
        }
      }
    );
    box1.morph({'opacity': 0});
  };

  /**
   * Method hidden all box form page
   */
  this.hide_box = function() {
    this.box.set(
      'morph',
      { 
        duration: this.config.change_content_duration, 
        onComplete: function() { 
          that.box.setStyle('display','none');
        }
      }
    );
    this.box.morph({'opacity': 0, 'height':0});    
  };

  /**
   * Method set wait status to avatar
   * 
   * @param int id - avatar id
   */
  this.set_wait_status = function(id) {
    var box = $('might_know_invite_button_'+id);
    box.addClass('might_know_wait_box');
  };

  /**
   * Method generate box with message 'nomore proposition...'
   * 
   *  @return Element
   */
  this.no_proposition = function() {
    var element = new Element('div',{ 'class': 'no_know_proposition'});

    element.innerHTML = '<span>Brak dalszych propozycji</span><p>Niestety, w tym momencie nie mamy kolejnych propozycji nowych znajomości</p>'+
      '<p>Możesz odnaleźć znajomych korzystając z <a href="/szukaj/profile">wyszukiwarki</a></p>';
    return element;
  };

};

$(window).addEvent(
  'load', 
  function(){
    MightKnow.onload(); 
  }
);
