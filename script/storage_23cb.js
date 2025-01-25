function isIE() {
  return window.ActiveXObject;
}

var GlobalClientStorage = function(host) {
  this.store = window.globalStorage[host];
};

GlobalClientStorage.prototype = {
  get: function(key) {
    var entry = this.store.getItem(key);
    if (entry) {
      return JSON.decode(entry.value);
    }
    return null;
  },
  set: function(key, val) {
    this.store.setItem(key, JSON.encode(val));
  },
  remove: function(key) {
    this.store.removeItem(key);
  }
};

var LocalClientStorage = function(host) {
  this.store = window.localStorage;
};

LocalClientStorage.prototype = {
  get: function(key) {
    var entry = this.store.getItem(key);
    if (entry) {
      return JSON.decode(entry);
    }
    return null;
  },
  set: function(key, val) {
    this.store.setItem(key, JSON.encode(val));
  },
  remove: function(key) {
    this.store.removeItem(key);
  }
};

var UserDataStorage = function() 
{
  if (this.storage = document.getElementById('userDataStorage')) {
    return;
  }
  
  this.storage = document.createElement('div');
  this.storage.setAttribute('id', 'userDataStorage');
  this.storage.style.behavior = 'url(#default#userdata)';
  this.storage.style.display = 'none';
  document.body.appendChild(this.storage);
};

UserDataStorage.prototype = {
  get: function(key) {
    this.storage.load('nk_cache_2');
    var key_value = this.storage.getAttribute(key);
    return key_value ? JSON.decode(key_value) : null;
  },
  set: function(key, val) {
     this.storage.setAttribute(key, JSON.encode(val));
     this.storage.save('nk_cache_2');
  },
  remove: function(key) {
    this.storage.load('nk_cache_2');
    this.storage.removeAttribute(key);
    this.storage.save('nk_cache_2');
  }
};

var FlashStorage = function() 
{
  this.storage = document.getElementById('flash_storage');
};

FlashStorage.prototype = {
  get: function(key) {
    return this.storage.get(key);
  },
  set: function(key, val) {
    try {
      if (!this.storage.set(key, val)) {
        throw new Error('flash storage is full');
      }
    } catch(e) {
      report_js_error(e, 'flash_storage_set_failed');
    }
  },
  remove: function(key) {
    this.storage.remove(key);
  },
  test: function() {
    if (!this.storage.test || !this.storage.test() || !this.storage.set || ! this.storage.remove || !this.storage.get) {
      return false;
    }
    try {
      this.storage.set('nk_cache', 'nk_cache_test');
      val = this.storage.get('nk_cache');
      this.storage.remove('nk_cache');
      
      return val == 'nk_cache_test';
    } catch (e) {
      return false;
    }
  }
};

function embed_flash_storage() {
  var flash_container = document.getElementById('flash_storage_container');
  
  if (isIE()){
    flash_container.innerHTML = '<object height="1" width="1" id="flash_storage" ' +
    'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
    '<param name="movie" value="' + getStaticUri('/flash/flash_storage.swf') + '">' +
    '<param name="quality" value="high">' +
    '<param name="AllowScriptAccess" value="always">' +
    '<param name="wmode" value="transparent">' +
    '</object>';
  } else {
    flash_container.innerHTML = '<object height="1" width="1" id="flash_storage" ' +
    ' type="application/x-shockwave-flash" data="' + getStaticUri('/flash/flash_storage.swf') + '">' +
    '<param name="quality" value="high">' +
    '<param name="AllowScriptAccess" value="always">' +
    '<param name="wmode" value="transparent">' +
    '</object>';
  }
  window.flash_storage_interface = new FlashStorage();
}

var CookieStorage = function() {
  
};

CookieStorage.prototype = {
  get: function(key){
    return JSON.decode(Cookie.read(key, {
      path: '/'
    }));
  },
  set: function(key, val, use_cookies)
  {
    if(use_cookies) {
      Cookie.write(key, JSON.encode(val), {
        path: '/'
      });
    }
  },
  remove: function(key) {
    Cookie.dispose(key, {
      path: '/'
    });
  }
};

/**
 * ClientStorage
 * don't use in IE before DOM ready!!
 * @param {Boolean} use_cookies
 */
var ClientStorage = {
  storage: null,
  callbacks: new Array(),
  can_use_flash: false,
  was_dom_ready: false,
  was_flash_embedded: false,
  gc_active: false,
  gc_bucket: 'GC_bucket_',
  gc_last_time: 'GC_last_time',

  get_storage: function() {
    return this.storage ? this : null;
  },

  wait_storage: function(callback) {
    if (this.storage != null) {
      callback();
    } else {
      this.callbacks.push(callback);
    }
  },
  
  domready: function() {
    this.was_dom_ready = true;
    this.decide_storage(false, false);

    this.decide_storage.bind(this, [false, false]).delay(1000);
    this.decide_storage.bind(this, [true, false]).delay(7000);
  },

  decide_storage: function(last_try, use_flash) {
    this.can_use_flash |= use_flash;
    if (this.storage === null) {
      if (window.localStorage) {
        this.storage = new LocalClientStorage();
        this.gc_active = true;
      } else if (window.globalStorage) {
        this.storage = new GlobalClientStorage(window.location.host);
        this.gc_active = true;
      } else if (isIE()) {
        this.storage = new UserDataStorage();
        this.gc_active = true;
      } else {
        if (this.can_use_flash && window.flash_storage_interface && window.flash_storage_interface.test()) {
          this.storage = window.flash_storage_interface;
          this.gc_active = true;
        } else if (!this.was_flash_embedded) {
          embed_flash_storage();
          this.was_flash_embedded = true;
        } else if (last_try && this.was_dom_ready) {
          this.storage = new CookieStorage();
        }
      }
      if (this.storage != null) {
        while (this.callbacks.length > 0) {
          try {
            var f = this.callbacks.pop();
            // we don't want to call this now, it'd cause firefox to crash
            f.delay(10);
          } catch (e) {
            report_js_error(e, 'Error while running storage callbacks');
          }
        }
        if (this.gc_active) {
          if (this.storage.get(this.gc_last_time) == null) {
            this.storage.set(this.gc_last_time, Math.floor((new Date().getTime())/1000/60/60/24), false);
          }
          setInterval('ClientStorage.run_gc()', 60*1000);
        }
      }
    }
    return null;
  },
  
  get: function(key) {
    var key_value = this.storage.get(key);

    if(key_value == null) {
      return null;
    }
    
    if(this.is_expired(key_value.expire)) {
      this.storage.remove(key);
      return null;
    } else {
      return  key_value.data;
    }
  },
  
  set: function(key, value, expires, use_cookies) { 
    try{   
      var expire = $type(expires) == 'number' ? new Date().getTime()+expires*1000 : null;
      this.storage.set(
        key, 
        {
          'data': value,
          'expire':  expire
        },
        use_cookies ? true : false
      );
      if (expire && this.gc_active) {
        var gc_bucket = this.gc_bucket + Math.floor(expire/1000/60/60/24);
        var arr = this.storage.get(gc_bucket) || [];
        arr.push(key);
        this.storage.set(gc_bucket, arr, false);
      }
    } catch(e) {
      //storage moze byc przepelniony
      report_js_error(e, 'storage_set_failed');
    }
  },
  
  remove: function(key) {
    this.storage.remove(key);
  },
  
  run_gc: function() {
    var last_check = this.storage.get(this.gc_last_time);
    var today = Math.floor((new Date().getTime())/1000/60/60/24);
    for (var day = last_check; day < today; day++) {
      var arr = this.storage.get(this.gc_bucket + day);
      if (arr != null) {
        while (arr.length > 0) {
          var el = arr.pop();
          this.get(el);
        }
      }
      this.storage.remove(this.gc_bucket + day);
    }
    this.storage.set(this.gc_last_time, today, false);
  },

  is_expired: function(t) {
    return t!=null && t < new Date().getTime();
  }
};

