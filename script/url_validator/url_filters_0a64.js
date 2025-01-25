var GenericUrlFilter = new Class({
  regexp : /\b(https?\:\/\/|www\.)[\w-.śćńółęąźż]{2,}\.[a-z]{2,5}((\/|#|\?)[\w-.?&%#=,+~;$\/śćńółęąźż():]*)?/gi,

  url_formats: [
    '<a href="$1" class="link bad" target="_blank" ><span class="link_msg">$3</span>$2</a>',
    '<a href="$1" class="link" target="_blank" ><span class="link_msg">$3</span>$2</a>',
    '<a href="$1" class="link" target="_blank" ><span class="link_msg">$3</span>$2</a>',
    '', //Ukrywamy linka
    '$1'
  ],
  
  
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
   * Funkcja pobiera informację o linku
   *
   * @param string url - sprawdznay link
   * @return object {domain: , type: 'other'}
   */
  get_url_info: function(url) 
  {  
    var temp = url.match(/(https?\:\/\/)?(.+\.[a-z]{2,4})/i).pop().split('.');    
        
    return {
      domain: temp.length > 1 ? temp[temp.length-2] + '.' +temp[temp.length-1] : 'undefined',
      type: 'other'
    };
  },
  
  /**
   * Funkcja pobiera i zwraca wszystkie znalezione w tekscie URL-e
   *
   * @param string text - tekst w którym szukamy URL-i
   * @return array - tablica znalezionych URL-i
   */
  get_all_urls: function(text) 
  {
    return text.match(this.regexp) || new Array();
  },
  
  /**
   * Funkcja pobiera nowy url w definiowanym formacie
   *
   * @param string old_url - orginalny url 
   * return string - nowy format url-a 
   */
  get_new_url: function(old_url,info) {    
    var old_url_params = old_url.match(/(https?:\/\/)?(.+)/i);
    var new_url = this.url_formats[info.status];
        new_url = new_url.replace(/\$1/g, (old_url_params[1] || 'http://') + encodeURIComponent(old_url_params[2]));
        new_url = new_url.replace(/\$2/g, encodeURIComponent(break_string(old_url_params[0],25,6)));
        new_url = new_url.replace(/\$3/g, htmlentities(info.message));
    
    return decodeURIComponent(new_url);
  }
    
});


/**
 * Filtr dla linków z serwisu YouTube.com
 */
var YouTubeUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?([\w]+\.youtube\.com\/watch\?){1}([\w&\?=]+)?(v=[a-zA-Z0-9-_]+)([\w&%\/=-]+)/g,
  
  url_formats: [
    '<a href="$1" class="player youtube_link bad" target="_blank" ><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player youtube_link" target="_blank" ><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player youtube_link" target="_blank" ><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '', //Ukrywamy linka    
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }
});

/**
 * Filtr dla linków z serwisu Wrzuta.pl
 */
var WrzutaUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?([\w.]+\.wrzuta\.pl\/(film|audio|obraz)\/[\w]+[\/\w\.&%?=-]+)/g,
  
  url_formats: [
    '<a href="$1" class="player wrzuta_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player wrzuta_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player wrzuta_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '', //Ukrywamy linka
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    var info = this.parent(url);
    switch(url.match(/wrzuta\.pl\/(film|audio|obraz)/).pop()) {
      case 'film': 
        info.type = 'video';
        return info;
        break;
      case 'audio':
        info.type = 'audio';
        return info;
        break;
      case 'obraz':
        info.type = 'image';
        return info;
        break;
    }
    return info;
  }
});

var VimeoUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?(www\.)?vimeo\.com\/[0-9]+/g,
  
  url_formats: [
    '<a href="$1" class="player vimeo_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player vimeo_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player vimeo_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }
});

var VideoGoogleUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?(www\.)?video.google\.(com|pl)\/videoplay\?docid=-?[0-9]+/g,
  
  url_formats: [
    '<a href="$1" class="player video_google_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player video_google_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player video_google_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }
});

var DailymotionUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?(www\.)?dailymotion\.(com|pl)\/video\/[0-9a-zA-Z_-]+/g,
  
  url_formats: [
    '<a href="$1" class="player dailymotion_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player dailymotion_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player dailymotion_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }
});

var InteriaUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?(video\.interia\.pl\/obejrzyj,film,)[0-9]+/g,
  
  url_formats: [
    '<a href="$1" class="player interia_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player interia_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player interia_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }
});

var ImageUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?.*\.(jpg|jpeg|bmp|gif|png)/gi,
  
  url_formats: [
    '<a href="$1" class="player image_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player image_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player image_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'image'});
  }  
});


var SpryciarzeUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?www\.spryciarze\.pl\/zobacz\/[a-z-]+/gi,
  
  url_formats: [
    '<a href="$1" class="player spryciarze_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player spryciarze_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player spryciarze_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }  
});

var LookrTvUrlFilter = new Class({
  Extends: GenericUrlFilter,
  regexp : /^(https?\:\/\/)?lookr\.tv\/player\.php\?id=[\d]+/gi,
  
  url_formats: [
    '<a href="$1" class="player lookr_link bad" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player lookr_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '<a href="$1" class="player lookr_link" target="_blank"><span class="link_msg">$3</span><span class="icon">&nbsp;</span>$2</a>',
    '',
    '$1'
  ],
  
  get_url_info: function(url) 
  {
    return $extend(this.parent(url), {type: 'video'});
  }  
});




var UrlFilterList = [
  new GenericUrlFilter(),
  new VimeoUrlFilter(),
  new ImageUrlFilter(),
  new WrzutaUrlFilter(),
  new YouTubeUrlFilter(),
  new InteriaUrlFilter(),
  new VideoGoogleUrlFilter(),
  new DailymotionUrlFilter(),
  new SpryciarzeUrlFilter(),
  new LookrTvUrlFilter()
];

