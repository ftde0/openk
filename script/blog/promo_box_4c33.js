var PromoBoxScript = new Class({
  add_close_btn_event: function () {
    var close_btn = $('hide_promo_entry');
    if (close_btn) {
      var that = this;
      close_btn.addEvent('click', function (event) {
        event.stop();
        that.hide_entry($('blog_entry_id').get('html'));
      });
    }
  },
  
  hide_entry : function (entry_id) {
    new Request.NK({ url : '/blog/'+nk_options.blog.main_blog_name+'/ajax_promo_hide/'+ entry_id }).send();
    this.show_next_entry();
  },
  
  show_next_entry : function () {
    var promo_entry_div = $('promo_entry');
    if (nk_options.blog.promo_entries_ids_to_show.length > 0) {
      var that = this;
      var mootools_misc = new MootoolsMisc();
      new Request.NK({
        url : '/blog/'+nk_options.blog.main_blog_name+'/ajax_promo/'+ nk_options.blog.promo_entries_ids_to_show.shift(),
        method : 'get',
        onSuccess : function (responseJSON, responseText) {
          if (promo_entry_div) {
            var promo_entry_date = $('promo_entry_date');
            var tween = promo_entry_div.get('tween', {property : 'opacity'});
            tween.start(0).chain(function() {
              promo_entry_div.set('html', responseJSON);
              promo_entry_date.set('html', mootools_misc.format_date(promo_entry_date.get('html')).replace(' ', '<span class="separator"> </span>'));
              that.add_close_btn_event();
              promo_entry_div.setStyle('display', 'block');
              tween.start(1);
            });
          } else {
            promo_entry_div = new Element('div', {'id' : 'promo_entry', 'style' : 'display:none'});
            promo_entry_div.inject(document.getElement('div.main_column_left'), 'top');
            promo_entry_div.set('html', responseJSON);
            var promo_entry_date = $('promo_entry_date');
            promo_entry_date.set('html', mootools_misc.format_date(promo_entry_date.get('html')).replace(' ', '<span class="separator"> </span>'));
            that.add_close_btn_event();
            promo_entry_div.setStyle('display', 'block');
          }
        },
        onFailure : function () {
          if (promo_entry_div) {
            var tween = promo_entry_div.get('tween', {property : 'opacity'});
            tween.start(0).chain(function(){
              promo_entry_div.setStyle('display', 'none');
            });
          }
        }
      }).send();
    } else {
      if (promo_entry_div) {
        promo_entry_div.setStyle('display', 'none');
      }
    }
  }
});

window.addEvent('load', function () {
  var the_script = new PromoBoxScript();
  the_script.show_next_entry();
});
