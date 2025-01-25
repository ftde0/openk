var NkWindowClass = new Class({
  cookie : 'nk_window',
  set_focus : function() {
    Cookie.write(this.cookie, 'focused' , {path : '/'});
  },
  set_blur : function() {
    Cookie.write(this.cookie, 'blured',  {path : '/'});
  },
  is_focused : function() {
    return Cookie.read(this.cookie,  {path : '/'}) == 'focused'; 
  },
  is_blured : function () {
    return Cookie.read(this.cookie,  {path : '/'}) == 'blured';
  },
  status : function() {
    return Cookie.read(this.cookie);
  }
});

var NkWindow = new NkWindowClass();
NkWindow.set_focus();
$(window).addEvent('load', function() {
  this.addEvent('focus', function() {
    NkWindow.set_focus();
  });
  $(document).addEvent('focus', function() {
    NkWindow.set_focus();
  });
  this.addEvent('blur', function() {
    NkWindow.set_blur();
  });
  $(document).addEvent('blur', function() {
    NkWindow.set_blur();
  });
});

$(window).addEvent('load', function() {
  $$('a.auto_open_in_new_window').each(function(e){
    var newWindow = window.open(e.href,'_blank');
    newWindow.focus();
  });
});
