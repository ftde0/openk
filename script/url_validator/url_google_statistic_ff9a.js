var UrlGoogleStatistic = new Class({
  filters: UrlFilterList,
  
  run: function(content) {
    urls = this.filters[0].get_all_urls(content);
    for(var i=0; i < urls.length; i++) {
      for(var j=this.filters.length-1; j>=0; j--) {
        if(this.filters[j].is_recognised_url(urls[i])) {
          this.send(this.filters[j].get_url_info(urls[i]));
          break;
        }
      }
    }
  },
  
  send: function(params) {
    if(pageTracker) {
      pageTracker._trackPageview('/gatrack_sledzik/'+ params.domain + '/' + params.type);
    }
  }
});
