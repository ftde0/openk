var TabUpdater = new Class({
  local : {
    timestamp : 0,
    window_id : '',
    data : ''
  },
  initialize : function(cookie_name, interval, window_id) {
    interval = interval || 1000;
    window_id = window_id || '';
    this.cookie_name = cookie_name;
    this.window_id = window_id;
    this.interval = interval;
  },
  setLoop : function() {
    this.get();
    this.get.periodical(this.interval, this);
  },
  get : function() {
    var events = Array();
    var new_data = JSON.decode(Cookie.read(this.cookie_name, {path : '/'}));
    if(new_data) {
      if(this.local.timestamp < new_data.timestamp) {
        events.push(this.onUpdate);
        if (this.isDataChanged(new_data.data)) {
          events.push(this.onChange);
        }
        else {
          events.push(this.onNoChange);
        }
      }
      this.local = new_data;
    } else {
      events.push(this.onEmpty);
    }
    var that = this;
    $each(events, function(event){
      event.bind(that)();
    }); 
  },
  onChange : function() {},
  onNoChange : function() {},
  onUpdate : function() {},
  onEmpty : function() {
  },
  isDataChanged : function(data) {
    return this.local.data != data; 
  },
  
  set : function(data_to_set) {
    var tmp_cookie = {
      timestamp : (new Date()).getTime(),
      window_id : this.window_id,
      data : data_to_set
    };
    this.local.timestamp = tmp_cookie.timestamp;
    this.local.window_id = tmp_cookie.window_id; 
    this.local.data = tmp_cookie.data
    Cookie.write(this.cookie_name, JSON.encode(tmp_cookie), {path : '/'});
  }
});
