var SledzikPromotedAvatar1 = new Class({
  Extends: SledzikFolloweeAvatar,
  
  type: 1,
  
  prepare_data : function(e) 
  {
    return $extend(this.parent(e), {job: e.user_info.PROMOTED_JOB});
  },
  
  render: function(raw_data) {
    var avatar = this.parent(raw_data);
        avatar.getElement('p.avatar_user_city').set('html',this.user_data.job);
        avatar.getElement('div.avatar_sledzik').addClass('celebritie');
        
    return avatar;
  }
});

var SledzikPromotedAvatar2 = new Class({
  Extends: SledzikFolloweeAvatar,
  
  typs: 2,
  
  prepare_data : function(e) 
  {
    return $extend(this.parent(e), {job: e.user_info.PROMOTED_JOB, description: e.user_info.DESCRIPTION});
  },
  
  render: function(raw_data) 
  {
    var wraper = new Element('div', {'class': 'promoted_wraper'});
    
    var avatar = this.parent(raw_data).inject(wraper);
        avatar.getElement('p.avatar_user_city').set('html',this.user_data.job);
        avatar.getElement('div.avatar_sledzik').addClass('celebritie');


    if(this.user_data.is_official === 1) {
      avatar.addClass('avatar_official');
      avatar.getElement('div.avatar_inner a').grab(new Element('span',{'class': 'official_tag'}));
    }
    
    new Element('div', {
      'class': 'avatar_sledzik_info',
      'html' : this.user_data.description
    }).injectTop(avatar.getElement('div.avatar_content'));

    return wraper;
  }
});

var SledzikPromotedAvatar3 = new Class({
  Extends: SledzikPromotedAvatar2,
  
  type: 3,
  
  prepare_data: function(e)
  {
    return $extend(this.parent(e), {www: e.user_info.PROMOTED_WWW});
  },
  
  render: function(raw_data) 
  {
    this.user_data = this.prepare_data(raw_data);

    var avatar = new Element('div', {
      'class' : 'avatar_slim',
      'events' : {
        'click' : function(e) { e.stopPropagation(); }
      }
    });
    
    avatar.form = this.get_followee_form(this.type);
    avatar.user = new Element.NK('div',
      {
        'class': 'user_name'
      },
      [
        'a',
        {
          'href': '/profile/'+this.user_data.id,
          'html': this.user_data.name.get_demo_prefix(33),
          'title': this.user_data.name
        }
      ]
    );
    
    avatar.adopt(avatar.form, this.get_photo(), avatar.user, this.get_job());
    
    if(this.user_data.www) {      
      new Element('a', {
        'href' : 'http://'+this.user_data.www,
        'text' : this.user_data.www,
        'class' : 'owner_link'
      }).inject(avatar.user);      
    }
    
    if(this.user_data.is_official === 1) {
      new Element('span', {'class': 'top'}).injectTop(avatar.addClass('microavatar_official'));      
    }
    
    return avatar;
  },
  
  get_job: function()
  {
    return new Element('div', {
      'class' : 'whois',
      'text' : this.user_data.job
    });
  },
  
  get_photo: function() 
  {
    return new Element.NK(
      'a',
      {
        'href'   : '/profile/' + this.user_data.id,
        'title'  : 'Przejdź do profilu',
        'class' : 'microavatar'
      }, 
      [
        'img', 
        {
          'alt'   : 'Pokaż profil',
          'class' : this.user_data.photo_uri ? '' : 'brak_zdjecia',
          'src'   : this.user_data.photo_uri || getStaticUri('/img/avatar/brakzdjecia'),
          'height' : 40
        }
      ]
    );
  }

});

var SledzikPromotedBoxMainAvatar = new Class({
  Extends: SledzikPromotedAvatar3,
  Implements: [SledzikPromotedAvatarInterface],
  
  type: 4,
  
  render: function(raw_data)
  {
    this.user_data = this.prepare_data(raw_data);
    
    var avatar = new Element('li', {'class': 'sledzik_shout'});
    
    avatar.ignored = this.get_promoted_ignored_form();
    
    avatar.photo = new Element.NK('div', {'class': 'shout_avatar'}, ['div',{'class':'microavatar'},[ this.get_photo()]]); 
    avatar.user = new Element.NK('div', {'class': 'user_name'},
      [
        'a',
        {
          'href': '/profile/'+this.user_data.id,
          'html': this.user_data.name.get_demo_prefix(15),
          'title': this.user_data.name
        }, null,
        'span',
        {
          'class': 'job',          
          'text': this.user_data.job
        }
      ]
    );
    
    if(this.user_data.is_followee == false) {
      avatar.form = this.get_followee_form(this.type); 
    }
    
    avatar.adopt(avatar.ignored, avatar.user, avatar.form, avatar.photo);
    
    avatar.photo.getElement('img').setStyle('height', 'auto');
    
    if(this.user_data.is_official === 1) {
      var temp = avatar.photo.getElement('div.microavatar');
          temp.addClass('microavatar_official');
          temp.grab(new Element('span',{'class': 'top'}),'top');
          temp.getElement('a').grab(new Element('span',{'class': 'inner_marker'}));
    }
    return avatar;
  }
});

var SledzikPromotedBoxSledzikAvatar = new Class({
  Extends: SledzikPromotedAvatar1,
  Implements: [SledzikPromotedAvatarInterface],
  
  type: 5,
  
  render: function(raw_data)
  {
    this.user_data = this.prepare_data(raw_data);
    
    var avatar = new Element('li');

    avatar.form = this.get_followee_form(this.type);
    avatar.ignored = this.get_promoted_ignored_form(); 
    
    avatar.photo = new Element.NK(
      'a',
      {
        'href': '/profile/'+this.user_data.id,
        'class': 'microavatar ',
        'title': 'Pokaż profil'
      },
      [
        'img',
        {
          'alt': 'Brak zdjęcia',
          'class': this.user_data.photo_uri ? '' : 'brak_zdjecia',
          'src': this.user_data.photo_uri ? this.user_data.photo_uri : getStaticUri('/img/avatar/brakzdjecia')                
        }
      ]
    );

    if(this.user_data.is_official === 1) {
      avatar.photo.addClass('microavatar_official');
      avatar.photo.grab(new Element('span',{'class': 'top'},'top'));
      avatar.photo.grab(new Element('span',{'class': 'inner_marker'}));
    }
    
    avatar.name = new Element('a', {
      'href': '/profile/'+this.user_data.id,
      'html': this.user_data.name.get_demo_prefix(20),
      'title': this.user_data.name,
      'class': 'user_name'
    });
    
    avatar.job = new Element('span', {
      'text': this.user_data.job,
      'class': 'owner_link'
    });
    
    return avatar.adopt(avatar.ignored, avatar.photo, avatar.form, new Element('div',{'class':'clear'}), avatar.name, avatar.job);
  }
});

var SledzikPromotedRankingAvatar = new Class({
  Extends: SledzikPromotedAvatar3,
  
  prepare_data: function(e)
  {
    return $extend(this.parent(e), {'shouts_count': e.user_info.SHOUTS_COUNT, 'followee_count': e.user_info.FOLLOWEE_COUNT, rank: e.pos+1});
  },
  
  get_job: function() {    
    return new Element.NK('dl',{},
      [
        'dt', {text: 'Liczba śledzących:'},null, 'dd', {text: this.user_data.followee_count}, null,
        'dt', {text: 'Liczba wpisów:'},null, 'dd', {text: this.user_data.shouts_count}
      ]
    );
  },
  
  get_photo: function() {
    return [
      new Element('span', {'class': 'rank', 'text': this.user_data.rank}),
      this.parent()
    ];
  }
});

