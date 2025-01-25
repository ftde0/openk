var AbstractPlugin = new Class({
  regexp : null,
  
  options: {
    
  },
  
  /** 
   * Funkcja sprawdza czy url jest pasuje do danego typu
   *
   * @param url - sprawdzany URL
   * @return true|false 
   */
  is_recognised_url: function(url) {
    this.regexp.lastIndex = 0;
    return this.regexp.test(url);
  },
  
  /**
   * Funkcja jest uruchamiana przez player w celu przygotowania potrzebnych danych
   * 
   *  @param string {url} - link do pliku 
   */
  data_prepare: function(url) {
    this.data_ready(this.options);
  },
  
  /**
   * Funkcja wywoływana gdy dane sa gotowe
   * 
   * @param object {options} - dane
   * 
   */
  data_ready: function(options) {
  
  }
    
});


/**
 * Plugin dla linków z serwisu youtube.com
 */
var YouTubePlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(https?\:\/\/|\b)([\w]+\.youtube\.com\/watch\?){1}([\w&\?=]+)?(v=[a-zA-Z0-9-_]+)([\w&%\/=-]+)/g,
  
  swf: 'http://www.youtube.com/v/$1&hl=pl&fs=1&autoplay=1&rel=0&fs=1',
  options : {
    params: {
      width: 640,
      height: 385,
      allowfullscreen: true,
      wMode: 'window',
      bgcolor: '#125C87',
      title: 'Plik multimedialny'
    }    
  },
  
  data_prepare: function(url) {
    var params = url.match(/v=([\w\-]+)/);
    this.options.swf = this.swf.replace(/\$1/,params[1]);
    this.options.notice = null;
    
    new Request.JSONP(
      {
        url: 'http://gdata.youtube.com/feeds/api/videos/'+params[1]+'?v=1&alt=json-in-script',
        log: false,
        timeout: 1000,
        onSuccess: function(result) {
          this.options.params.title = result.entry.title.$t; 
          if(result.entry.content) {
            this.options.notice = 'Opis: '+ result.entry.content.$t;
          }
          this.data_ready(this.options);
        }.bind(this),
        onCancel: function() {
          this.data_ready(this.options);
        }.bind(this)
      }
    ).send();
  }  
});

/**
 * Plugin dla linków z serwisu wrzuta.pl
 */
var WrzutaPlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(https?\:\/\/|\s)([\w.]+\.wrzuta\.pl\/(film|audio|obraz)\/[\w]+[\/\w\.&%?=-]+)/g,
  
  img: 'http://www.wrzuta.pl/sr/d/',
  audio: 'http://www.wrzuta.pl/audio.swf',
  video: 'http://www.wrzuta.pl/video.swf',
  
  options: {
    params: {
      width: 450,
      height: 387,
      lang: 'pl',
      host: 'wrzuta.pl',
      site: 'wrzuta.pl',
      autoplay: 1,
      allowFullscreen: true,
      title: 'Plik multimedialny'
    }
  },

  data_prepare: function(url) {
    var img = null, swf = null;
    var params = url.match(/(https?\:\/\/[\w.]+\.wrzuta\.pl)\/(film|audio|obraz)\/([\w%]+)\/([\w\.&%?=-]+)/);
    switch(params[2]) {
      case 'audio':
        this.options.params.width = 450;
        this.options.params.height = 70;
        this.options.params.key = params[3];        
        this.options.swf = this.audio;
        this.options.img = null;
        break;
      case 'film':
        this.options.params.width = 450;
        this.options.params.height = 387;
        this.options.params.key = params[3];
        this.options.params.file_key = params[3];
        this.options.swf = this.video;
        this.options.img = null;
        break;
      case 'obraz':
        this.options.swf = null;
        this.options.img = params[1]+'/sr/d/'+params[3];
        this.options.params.title = params[4].replace(/_/g,' ').capitalize();
        break;
    }
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});

/**
 * Plugin dla linków z serwisu vimeo.com
 */
var VimeoPlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?(www\.)?vimeo\.com\/[0-9]+/g,
  
  options: {
    params: {
      width: 640,
      height: 360,
      autoplay: 1,
      show_title: 1,
      allowFullscreen: true,
      fullscreen: 1,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/vimeo\.com\/([0-9]+)/);

    this.options.img = null;
    this.options.swf = 'http://www.vimeo.com/moogaloop.swf?clip_id='+param[1];
    this.options.params.clip_id = param[1];    
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});

/**
 * Plugin dla linków z serwisu Dailymotion.com
 */
var DailymotionPlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?(www\.)?dailymotion\.(com|pl)\/video\/[0-9a-zA-Z_-]+/g,
  
  options: {
    params: {
      width: 640,
      height: 360,
      autoplay: 1,
      show_title: 1,
      allowFullscreen: true,
      fullscreen: 1,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/dailymotion\.(com|pl)\/video\/([0-9a-zA-Z_-]+)/);

    this.options.img = null;
    this.options.swf = 'http://www.dailymotion.com/swf/video/'+param[2];
    this.options.params.clip_id = param[2];    
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});

/**
 * Plugin dla linków z serwisu video.google.com
 */
var VideoGooglePlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?(www\.)?video.google\.(com|pl)\/videoplay\?docid=(-)?[0-9]+/g,
  
  options: {
    params: {
      width: 640,
      height: 360,
      autoplay: 1,
      show_title: 1,
      allowFullscreen: true,
      fullscreen: 1,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/video.google\.(com|pl)\/videoplay\?docid=(-?[0-9]+)/);

    this.options.img = null;
    this.options.swf = 'http://video.google.com/googleplayer.swf?docId=' + param[2];
    this.options.params.clip_id = param[2];
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});
/**
 * Plugin dla linków z serwisu video.interia.pl
 */
var InteriaPlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?(video\.interia\.pl\/obejrzyj,film,)[0-9]+/g,
  
  options: {
    params: {
      width: 640,
      height: 385,
      autoplay: 1,
      allowFullscreen: true,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/[0-9]+/);
    this.options.img = null;
    this.options.swf = 'http://video.interia.pl/i/players/iVideoPlayer.09.swf';
    this.options.params.vid = param[0];
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});
/**
 * Plugin dla linków z serwisu spryciarze.pl
 */
var SpryciarzePlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?www\.spryciarze\.pl\/zobacz\/[a-z0-9-]+/g,
  
  options: {
    params: {
      width: 656,
      height: 394,
      autoplay: 1,
      allowFullscreen: true,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/zobacz\/([a-z0-9-]+)/);
    this.options.img = null;
    this.options.swf = 'http://www.spryciarze.pl/em_player/player/waPlayer.swf';    
    this.options.params.VideoID = param[1];
    this.options.params.notice = null;
    this.options.params.title = param[1].replace(/-/g,' ').capitalize();
    this.data_ready(this.options);
  }
});

var LookrTvPlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(http\:\/\/)?lookr\.tv\/player\.php\?id=[0-9]+/g,
  
  options: {
    params: {
      width: 640,
      height: 390,
      autoplay: 1,
      allowFullscreen: true,
      title: 'Plik multimedialny'
    }
  },
  
  data_prepare: function(url) 
  {
    var param = url.match(/id=([0-9]+)/);
    this.options.img = null;
    this.options.swf = 'http://lookr.tv/flash/vCastPlayer.swf?episodeId=' + param[1];    
    this.options.params.episodeId = param[1];
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});


var ImagePlugin = new Class({
  Extends: AbstractPlugin,
  regexp : /(https?\:\/\/|\s).*\.(jpg|jpeg|bmp|gif|png)/gi,
  
  options: {
    params: {
      title: 'Plik graficzny'
    }
  },
  
  data_prepare: function(url) {
    this.options.swf = null;
    this.options.img = url;    
    this.options.params.notice = null;
    this.data_ready(this.options);
  }
});
