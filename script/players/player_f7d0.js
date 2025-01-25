/**
 * Klasa playera
 * require popup.js, mootools-more.js 
 */
var GenericPlayer = new (new Class({
  
  params: {
    wmode: "transparent",
    width: 425,
    height: 385
  },  

  plugins: [],
  is_running: false,

  /**
   * Konstruktor
   */
  initialize: function() 
  {
    this.content = new Element('div', { 'id': 'nk_player_content' } );   
  },
   
  /**
   * Funkcja uruchamia playera
   *
   * @param string {url} - url do pliku
   */  
  play: function(url) 
  {
    if(this.is_running) {
      return false;
    }

    var that = this, player = null;
    this.is_running = true;

    this.popup = new Popup({        
      'title': 'Ładowanie...',
      'content': PopupConfig.loading,
      'position': null,
      'content_safe_mode': false,
      'extra_class': 'nk_movie_player',
      'draggable': !(Browser.Engine.trident && Browser.Engine.version <=4)
    });

    this.popup.addEvent('onClose', function() {
      this.is_running = false;
    }.bind(this));
    
    for(var i=0, l=this.plugins.length; i<l; i++) {
      if(this.plugins[i].is_recognised_url(url)) {
        player = this.plugins[i];
        break;
      }
    }

    if(player) {
      player.data_ready = this.run_player.bind(this);
      player.data_prepare(url);
    } else {
      this.popup.update({
        'title': 'Błąd',
        'position': null,
        'content': 'Nieobsługiwany format linków',
        'buttons': [ {'label': 'Ok'}]
      });
    }
  },
  
  run_player: function(options) 
  {    
    var that = this;

    if(options.swf) {
      this.content.empty();
      new Swiff(options.swf, {
        width: options.params.width,
        height: options.params.height,
        vars: options.params,
        params: options.params,
        container: this.popup.box.contener
      });
      
      if(options.notice) {        
        var notice = options.notice.replace(/\r\n/g,'');
        new Element('p', {'class':'youtube_description','text': (notice.length > 500 ? notice.substr(0,500)+'...' : notice) }).injectBottom(this.popup.box.contener);
      }
      
      this.popup.update({
        'title': options.params.title,          
        'width': options.params.width + 10,
        'height': options.params.height + 10,
        'content': null,
        'position': null
      });
       
      if(options.notice) {
        var notice = this.popup.box.getElement('p.youtube_description');
        this.popup.update({'height': options.params.height + notice.getHeight() + notice.getStyle('margin-top').toInt() + notice.getStyle('margin-bottom').toInt() + 10, position:null});
      }
      
      this.content.empty();
      
    } else if(options.img) {

      var img = new Image();
          img.onload = function() {
            var size = window.getSize(), ws = this.width/this.height;

            if(this.width > size.x-100) {
              this.width = size.x - 100;
              this.height = Math.round(this.width / ws);
            }
            if(this.height > size.y-100) {
              this.height = size.y - 100;
              this.width = Math.round(this.height * ws);
            }
            that.popup.update({
              'title': options.params.title,
              'content': this,
              'position': null,
              'width': Math.max(this.width, 130)+10,
              'height': this.height
            });
          };

          img.onerror = function() {
            this.popup.update(
              {
                'width': 300,
                'title': 'Błąd ładowania pliku',
                'position': null,
                'content': 'Nie można wczytać wskazanego pliku.<br>Możesz spróbować go otworzyć w nowym oknie.',                
                'buttons': [
                  {'label': 'Otwórz', 'onClick': function() { window.open(options.img,'_blank')}},
                  {'label': 'Zamknij'}
                ]
              }
            );
          }.bind(this);
          
          img.src = options.img;  
    }
  }
}))();

// Można dopisywać filtry do innych serwisów.
GenericPlayer.plugins = [
  new WrzutaPlugin(),
  new YouTubePlugin(), 
  new VimeoPlugin(),
  new InteriaPlugin(),
  new ImagePlugin(),
  new VideoGooglePlugin(),
  new DailymotionPlugin(),
  new SpryciarzePlugin(),
  new LookrTvPlugin()
];
