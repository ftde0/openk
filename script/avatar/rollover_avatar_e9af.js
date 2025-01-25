var RolloverAvatar = new Class({
 
 Extends : GenericAvatar,
 
 link_prefix: null,
 hash : false,

 status_to_class : [
  'unavailable',
  'available',
  'away',
  'invisible',
  'no_nktalk_unavailable',
  'no_nktalk_available'
 ],

 load_options : function() {
   this.options = new Array();
   this.add_option(new AvatarOptionStartConversation(this.user_data.nktalk_granted && this.user_data.nktalk_enabled, this.user_data.raw_user_info,this.hash));
   this.add_option(new AvatarOptionSendMessage(this.user_data.id,this.hash));
   this.add_option(new AvatarOptionArchive(this.user_data.id, this.hash));
   this.add_option(new AvatarOptionProfile(this.user_data.id, this.hash));
   this.add_option(new AvatarOptionSendGift(this.user_data.id, this.hash));
 },

 prepare_data : function(u) {
   var user_data = {
     id : u.UID,
     name : u.FIRST_NAME + ' ' + u.LAST_NAME,
     photo_uri : u.AVATAR,
     status : u.xmpp_status,
     nktalk_enabled : u.NKTALK_ENABLED,
     nktalk_granted : u.NKTALK_GRANTED,
     nktalk_invited : u.NKTALK_INVITED,
     status_text : u.STATUS_TEXT,
     raw_user_info : u
   }
   return user_data;
 },
 
 ALREADY_INVITED_TEXT : 'Użykownik został już zaproszony do nktalka',
 NO_INVITATIONS_LEFT_TEXT : 'Niestety nie masz już zaproszeń',
 INVITATIONS_DISABLED_TEXT : 'Przepraszamy, zaproszenia tymczasowo wyłączone',
 FRIENDS_LIMIT_EXCEEDED_TEXT : 'Użytkownik ma zbyt wielu znajomych', 
 RESPONSE_OK_TEXT : 'Zaproszenie zostało wysłane',
 RESPONSE_ERROR_TEXT : 'Wystąpił błąd, spróbuj ponownie za chwile',

 get_invitation_box : function() {
   var invitation_box = new Element('div', {'class' : 'invitation_box'});
   if(this.nktalk.config.invitations_enabled == 0 || (this.user_data.nktalk_enabled && this.user_data.nktalk_granted) ) {
     return invitation_box;
   }
   var step_one = new Element('div', {
     'text' : 'Zaproś do NkTalk',
     'events' : {
       'click' : function() {
         step_one.setStyle('display', 'none');
         step_two.setStyle('display', 'block');
       }
     },
     'class' : 'invitation_button'
   });
   var step_two = new Element('div', {
     'class' : 'invitation_message'
   });
   var ok_button = new Element('div', {
     'class' : 'ok',
     'text' : 'OK',
     'events' : {
       'click' : function() {
         step_one.setStyle('display', 'block');
         step_two.setStyle('display', 'none');
       }
     }
   });
   if(this.user_data.nktalk_granted) {
     //uzytkownik ma nktalka ale go wylaczyl - napisz do niego
     var par = new Element('p', {
       'class' : 'napisz_txt',
       'html' : '<span>Ten użytkownik wyłączył NKtalka. Możesz do niego napisać, by włączył go ponownie.</span>'
     });
     var link = new Element('a', {
       'href' : this.get_proper_uri('poczta/compose/') + this.user_data.id,
       'text' : 'Napisz do niego',
       'class' : 'napisz'
     });
     var clear = new Element('div', {'class' : 'clear'});
     par.grab(link);
     par.grab(clear);
     step_two.grab(par);
   } else {
     if(this.user_data.nktalk_invited) {
       //nie ma nktalka ale juz go ktos zaprosil, z tym juz nic nie zrobimy
       step_two.grab(new Element('p', {'text' : this.ALREADY_INVITED_TEXT}));
       step_two.grab(ok_button);
     } else {
       // nie ma nktalka i nikt go jeszcze nie zaprosil
       if(this.nktalk.config.invitations_count > 0) {
         var response_div = new Element('div', {
           'class' : 'invitation_message'
         });
         response_div.setStyle('display', 'block');
         invitation_box.grab(response_div);
        
         // mamy jeszcze zaproszenia
         step_two.grab(new Element('p', {'text' : 'Pozostało Ci ' + this.nktalk.config.invitations_count + ' zaproszeń'}));
         var button = new Element('div', {
           'text' : 'Zaproś użytkownika',
           'class' : 'zapros',
           'events' : {
             'click' : function() {
               var request = new Request.NK({
                 'url' : '/nktalk/invitations/invite',
                 'data' : {
                   'user_id' : this.user_data.id
                 },
                 'onSuccess' : function(response) {
                   if(response.STATUS == 'OK') {
                     this.nktalk.bar_win.friends_list.mark_as_invited(this.user_data.id);
                     response_div.grab(new Element('p', {'text' : this.RESPONSE_OK_TEXT}));
                   }
                   if(response.STATUS == 'DUPLICATED') {
                     this.nktalk.bar_win.friends_list.mark_as_invited(this.user_data.id);
                     response_div.grab(new Element('p', {'text' : this.ALREADY_INVITED_TEXT}));
                   }
                   if(response.STATUS == 'ERROR') {
                     response_div.grab(new Element('p', {'text' : this.RESPONSE_ERROR_TEXT}));
                   }
                   if(response.STATUS == 'NO_INVITATIONS_LEFT') {
                     response_div.grab(new Element('p', {'text' : this.NO_INVITATIONS_LEFT_TEXT}));
                   }
                   if(response.STATUS == 'FRIENDS_LIMIT_EXCEEDED') {
                     response_div.grab(new Element('p', {'text' : this.FRIENDS_LIMIT_EXCEEDED_TEXT}));
                   }
                   if($defined(response.INVITATIONS_LEFT)) {
                     this.nktalk.config.invitations_count = response.INVITATIONS_LEFT; 
                   }
                  
                 }.bind(this),
                 'onFailure' : function() {
                   response_div.grab(new Element('p', {'text' : this.INVITATIONS_DISABLED_TEXT}));
                 }.bind(this),
                 'onComplete' : function() {
                   step_one.setStyle('display', 'none');
                   step_two.setStyle('display', 'none');
                   response_div.setStyle('display', 'block');
                 }.bind(this)
               });
               try {
                 request.send();
               } catch(e) {
               }
             }.bind(this)
           }
         });
         step_two.grab(button);
       } else {
         // skonczyly sie
         step_two.grab(new Element('p', {'text' : this.NO_INVITATIONS_LEFT_TEXT}));
         step_two.grab(ok_button);
       }
      
      }
    
   }
   invitation_box.grab(step_one);
   step_two.setStyle('display' , 'none');
   invitation_box.grab(step_two);
   return invitation_box;
 },
 
 render : function(raw_data) {
   this.nktalk = $(window)['nktalk'] || $(window).parent['nktalk'];
   this.user_data = this.prepare_data(raw_data);
   this.load_options();
   var wrapper = new Element('div', {'class' : 'rollover_data'});
   var clear = new Element('div', {'class' : 'clear'});
   var photo = this.get_photo();
   var photo_link = photo.getElement('a');
   try { 
     nktalk; 
     this.link_prefix = '/#';
   } catch(e) {
      var link = false;
      try {
        if (top != window) {
        link = top.nktalk_portal_manager.nk_host
        }
      } catch (e) {
      }
      this.link_prefix = link || '/';
   }
   photo_link.set('href', this.link_prefix + photo_link.get('href').substr(1));
   wrapper.grab(photo);
   wrapper.grab(this.get_options_list());   
   wrapper.grab(clear);
   wrapper.grab(this.get_invitation_box());
   wrapper.grab(this.get_user_info());
   return wrapper;
 },
 get_user_info : function() {
   var user_box = new Element('p');
   var user_link = new Element('a', {
     'href': this.link_prefix + 'profile/' + this.user_data.id
   });
   var user_name = new Element('strong', {
     'text' : this.user_data.name,
     'class' : this.status_to_class[this.user_data.status]
   });
   user_box.grab(user_link);
   user_link.grab(user_name);
   var status_text_wrapper = new Element('span', {
     'text' : this.user_data.status_text,
     'id' : 'rollover_status_text'
   });
   user_box.grab(status_text_wrapper);
   return user_box;
 },
 get_proper_uri : function(uri) {
   var proper_uri, link_prefix;
   try {  
     nktalk; 
     link_prefix = '/#';
   } catch(e) { 
    var link = false; 
    try { 
      if (top != window) { 
        link = top.nktalk_portal_manager.nk_host 
      } 
    } catch (e) { 
    } 
    link_prefix = link || '/'; 
  }
  proper_uri = link_prefix + uri;
  return proper_uri; 
 }
});
