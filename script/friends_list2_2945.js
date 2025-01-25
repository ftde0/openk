//keep in sync with FriendsListJSON.php
var FriendsList = new Class({

  Extends : GenericList,

  initialize : function (flags,filter_input_id, window_div_id,his_id,his_version,my_id,my_version,max_columns,max_rows,row_height_px,get_cell_html,on_ready_to_show,make_keyword,make_sortword,on_selection,on_deselection){
    this.extra_info = new Array();
    this.users_info= null;
    this.hide_unknown = false;

    this.own_friends = null;

    this.filter_input_id = filter_input_id;

    this.flags = flags;
    this.todo = 0;    

    this.my_id = my_id;
    this.his_id = his_id;
    this.his_version = his_version;
    this.my_version = my_version;
    
    this.on_ready_to_show = on_ready_to_show;
    this.ge_make_keyword = make_keyword;
    this.ge_make_sortword = make_sortword;
    this.ge_on_selection = on_selection;
    this.ge_on_deselection = on_deselection;
    this.ge_get_cell_html = get_cell_html;
    this.parent(filter_input_id, window_div_id, max_columns, max_rows, row_height_px);
  },
  
  extra_request: function(request_description){
    return new Request.NK({
      url: request_description.uri,
      method: 'get',
      
      onSuccess: function (text,xml) {
        var ret = text;
        if(typeof(ret)=="object" && ret.UID){
          var uids = ret.UID;
          var by_uid = {};
          for(var i=this.users_info.length;i--;){
             var uid=this.users_info[i].UID;
             by_uid[uid] = {};
          } 
          for(var f in request_description.fields){
            if(!ret[f]) {
              continue;
            }
            for(var i=ret[f].length;i--;){
              if(by_uid[ret.UID[i]]){
                by_uid[ret.UID[i]][f] = ret[f][i];
              }
            }
          }        
          for(var i=this.users_info.length;i--;){
            var uid=this.users_info[i].UID;
            for(var f in request_description.fields){
              this.users_info[i][f] = by_uid[uid][f] || request_description.fields[f];
            }
          }
        }
      }.bind(this)
    });
  },
  
  rebuild_list : function (first_visible_row,force){
    this.parent(first_visible_row,force);
    if(this.list_displayed.length==0) {
      if(this.hide_unknown) {
        this.show_info_empty_list('Nie macie wspólnych znajomych');
      }
      if(this.is_name_day()) {
        this.show_info_empty_list('Nikt z Twoich znajomych nie obchodzi dziś imienin');
      }        
    }
  },
  
  show_info_empty_list :  function(message)
  {
    this.row_slot_div[0].innerHTML = '<div class="pointer_box" > ' + message + '</div>';
    this.rows_currently_in_table[0]=0;
  },

    
  extendEventInfo : function(e,element_id) {
    e.user_info=this.users_info[element_id];
    e.my_id=this.my_id;
    e.his_id=this.his_id;
    //wypadaloby rozdzielic avatary od listy // 8 = flaga od avatarow
    if(!(this.flags & FRIENDS_LIST_FIELD_FLAGS.AVATAR)) {
      return;
    }
    if(e.user_info.AVATAR){
      e.user_info.AVATAR=this.decompress_avatar_uri(e.user_info.AVATAR);
    }else{
      e.user_info.AVATAR=AVATAR_SETTINGS.no_photo;
    }
  },
 

  filter_function : function(e) {
    if(this.is_name_day()) {
      return this.have_user_name_day(this.users_info[e.id]);
    }
      
    if(!this.parent(e)){
      return false;
    }
    
    if(this.hide_unknown){
      this.extendEventInfo(e,e.id);
      return e.user_info.is_known;
    }
    return true;
  },

  is_name_day : function(){
    return (nk_options.name_day && nk_options.name_day.enabled == true);
  },
  
  have_user_name_day : function(e){
    var t = this.escape_polish_chars(e.FIRST_NAME.toLowerCase()).trim();
    for(var key in nk_options.name_day.names) {
      if(t == nk_options.name_day.names[key]) {
        return true;
      }
    }
    return false;
  },
  
  escape_polish_chars : function(e){
    var a = 'ęóąśłżźćń';
    var b = 'eoaslzxcn';
    for(var i=0; i<a.length; i++) {
      e = (e.replace(new RegExp(a.charAt(i),'g'),b.charAt(i)));
    }
    return e;
  },
  
  make_sortword : function(i,order) {
    var e={};
    this.extendEventInfo(e,i);
    return this.ge_make_sortword(e,order);
  },

  make_keyword : function(i) {
    var e={};
    this.extendEventInfo(e,i);
    return this.ge_make_keyword(e);
  },

  decompress_avatar_uri : function(photo_uri){
    if(photo_uri==null || photo_uri=='')
      return photo_uri;
    return photo_uri.replace(/^(\d*)-(\d*)-(.*)$/,'//photos.nasza-klasa.pl/$1/$2/thumb/$3.jpeg');
  },
  
  get_cell_html : function(e){
    this.extendEventInfo(e,e.id);
    return this.ge_get_cell_html(e);
  },

  own_friends_request : function (){
    var _this = this;
    return new Request.NK({
      url: '/friends_list/' + this.my_id + '/' + FRIENDS_LIST_FIELD_FLAGS.UID + '/' + this.my_version,
      method : 'get',
      onSuccess: function (ret){ 
        if(typeof(ret)=="object" && ret.UID){
          _this.own_friends=ret.UID;
        }     
        _this.own_friends.sort(function (a,b){return a-b;}); 
      }
    });
  },

  his_friends_request : function (){
    var _this = this;
    return new Request.NK({
      url: '/friends_list/' + this.his_id + '/' + (FRIENDS_LIST_FIELD_FLAGS.UID|this.flags) + '/' + this.his_version ,
      method: 'get',
      onSuccess: function (ret) {
        if(typeof(ret)=="object" && ret.UID){
          _this.users_info=new Array();
          for(var i=ret.UID.length;i--;){
            _this.users_info[i]={};
          }
          for(var f in FRIENDS_LIST_FIELD_FLAGS){
            if(ret[f]){
              var tmp=ret[f];
              for(var i=tmp.length;i--;){
                _this.users_info[i][f]=tmp[i];
              }
            }
          }
        }
      }
    });
  },

  is_known : function (uid){
    if(this.his_id==this.my_id){
      return true;  
    }
    var f=0;
    var t=this.own_friends.length;
    while(f+1<t){
      var c=(f+t)>>1;    
      if(this.own_friends[c]>uid)
        t=c;
      else
        f=c;
    }
    return this.own_friends[f]==uid;
  },

  cache_is_known : function(){
    for(var i=0;i< this.users_info.length;++i){
      this.users_info[i].is_known=this.is_known(this.users_info[i].UID);
    }
    this.own_friends = null;   
  },
  another_success : function(){
    if(!--this.todo){
      if (!this.users_info) { 
        this.users_info = []; 
      }
      this.cache_is_known(); 
      this.setAllElementsCount(this.users_info.length);
      this.on_ready_to_show(); 
    }
  },
  download : function(){
    this.queue = new Request.Queue({
      onSuccess: function(name,instance,txt,xml){
        this.another_success();
      }.bind(this)
    });
    ++this.todo;
    this.enqueue_requests();
    this.another_success();
  },
  add_request: function (name, request){
    ++this.todo;
    this.queue.addRequest(name,request);
    this.queue.send(name);  
  },
  enqueue_requests : function(){
    this.add_request('his',this.his_friends_request());
    if(this.his_id!=this.my_id){
      this.add_request('own',this.own_friends_request());
    }
    if(this.config && this.config.extra_requests){
      for(var i=0;i<this.config.extra_requests.length;++i){
        var request_description = this.config.extra_requests[i];
        this.add_request(request_description.name,this.extra_request(request_description));
      }
    }
  },
  
  on_selection : function(e){
    if(this.ge_on_selection){
      this.extendEventInfo(e,e.id);
      this.ge_on_selection(e);
    }
  },

  on_deselection : function(e){
    if(this.ge_on_deselection){
      this.extendEventInfo(e,e.id);
      this.ge_on_deselection(e);
    }
  }

});
