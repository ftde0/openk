/**
 * Storage do zapamietywania w cookiesach ustawien nktalka 
 *
 */
var NktalkStorage = new Class({
  
  cookie_name : 'nktalk_storage',
  
  cookie_duration : 1000, //in days

  data : {
    'roster_position' : {},
    'roster_is_visible' : 0,
    'roster_height' : 372,
    'roster_width' : 328,
    'nktalk_full_minimized': 0,
    'force_load' : 0
  },
  initialize : function() {
    this.load();   
  },
  load : function() {
    var cookie_data = JSON.decode(Cookie.read(this.cookie_name, {path : '/'}));
    $extend(this.data, cookie_data);
  },
  store : function() {
    Cookie.write(this.cookie_name, JSON.encode(this.data), {duration : this.cookie_duration, path : '/'});
  },
  get : function(key) {
    this.load();
    if(!$defined(this.data[key])) {
      return null;
    }
    return this.data[key];
  },
  set : function(key, value) {
    this.load();
    if(!$defined(this.data[key])) {
      return null;
    }
    this.data[key] = value;
    this.store();
  }
});
