var AutoRefreshableDiv = new Class({
  initialize : function(interval_ms,refresh_uri){
    this.interval_ms = interval_ms;
    this.refresh_uri = refresh_uri;
    this.timer = null;
    this.running = 0;
  },
 
  update : function(json,txt){
    $log(txt);
  },

  failed : function(){
    $log('failed to refresh from : ' + this.refresh_uri);
  },

  refresh : function(){
    this.request = new Request.NK({
      url: this.refresh_uri,
      method: 'get',
      onSuccess : this.update.bind(this),
      onFailure : this.failed.bind(this)
    });
    this.request.send();
  },

  start : function(){
    if(!this.running++){
      this.refresh(this.interval_ms);
      this.timer=this.refresh.periodical(this.interval_ms,this);
    }
  },

  stop : function(){
    if(!--this.running){
      $clear(this.timer);
      this.request.cancel();
    }
  }

});
