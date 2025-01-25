var UrlValidator = new Class({
  ttl: 600, //czas życia wpisu w cache podany w sekundach ~10min

  running : false,
  
  todo_urls : {},
  /**
   * Funkcja validuje url-e. Po zakończeniu wywołuje funkcje przekazany callback.
   *
   * @param array {urls} - tablica associacyjna url-i url => { md5 : , status: null }
   */
  check_urls: function(urls, callback) {
    $extend(this.todo_urls, urls); //dodajemy urle do todo listy

    ClientStorage.wait_storage(this.check_url_list.bind(this, callback));
  },
  
  check_url_list: function(callback) {
    if(this.running) {//lock na czas przetwarzania porcji urli
      return;
    }
    
    this.running = true;
    this.cache = ClientStorage.get_storage();
    var all_urls = this.todo_urls;
    this.todo_urls = {};
    this.unknow_urls = new Array();

    for(var url in all_urls) {      
      all_urls[url].info = this.get_info(all_urls[url].hash);
      if( all_urls[url].info == null ) {
        this.unknow_urls.push(url);
      }
    }
    if(this.unknow_urls.length) {
      new Request.NK(
        {
          url: '/url_validator',
          data: {'urls': JSON.encode(this.unknow_urls) },
          onSuccess: function(response) {
            for(var url in all_urls) {
              if( all_urls[url].info == null ) {
                all_urls[url].info = response.urls_status.shift();
                this.set_info(all_urls[url].hash,all_urls[url].info);
              }
            }
            callback(all_urls);
          }.bind(this),
          onComplete : function() {
            this.running = false;
            this.on_check_complete();
          }.bind(this)
        }
      ).send();
    } else {
      this.running = false;
      this.on_check_complete();
      callback(all_urls);
    }
  },
  
  get_info: function(url_hash) {
    return this.cache ? JSON.decode(this.cache.get('_'+url_hash)) : null;
  },
  
  set_info: function(url_hash, info) {
    if(this.cache) {
      this.cache.set('_'+url_hash, JSON.encode(info), this.ttl);
    }
  },
  
  /**
   * Funkcja wywoływana po zakończeniu validacji url-i.
   *
   * @param array {urls} - tablica associacyjna url-i url => { md5 : , status: status urla }
   */  
  on_check_complete: function(urls_status) {

  }
});
