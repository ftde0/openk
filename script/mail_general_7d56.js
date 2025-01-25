var MailsGeneral = new Class({

  dust_bin_text : null,

  initialize: function (){
    this.main_div = $('mail_coolbox');
    this.form = $('mail_form');
    this.activities1 = $('activities1');
    this.activities2 = $('activities2');
  },

  prepare_dust_bin_text : function (){
    this.dust_bin_text = nk_options.mails.delete_header;
  },

  prepare_activities_selectboxes : function () {
    var that = this;
    this.activities1.addEvent('change', function(){that.form.submit();});
    this.activities2.addEvent('change', function(){that.form.submit();});
  },

  prepare_select_all_buttons : function (){
    var that = this;
    this.main_div.getElements('a.select_all').each(
      function(el) {
        el.addEvent('click', function(e){
          that.select_all_none(true);
          e.preventDefault();
        });
      }
    );
  },
  
  prepare_select_none_buttons : function (){
    var that = this;
    this.main_div.getElements('a.select_none').each(
      function(el) {
        el.addEvent('click', function(e){
          that.select_all_none(false);
          e.preventDefault();
        });
      }
    );
  },

  prepare_select_buttons : function (){
    this.prepare_select_all_buttons();
    this.prepare_select_none_buttons();
  },

  remove_hovers : function (obj) {
    //cyszczenie hovera aktulanego obiektu
    if(obj.hasClass('checked_hover')){ obj.removeClass('checked_hover'); }
    if(obj.hasClass('unread_hover')){ obj.removeClass('unread_hover'); }
    if(obj.hasClass('hover')){ obj.removeClass('hover'); }
  },

  add_hovers : function (obj) {
    this.remove_hovers(obj);
    // nieprzeczytane  
    if(obj.hasClass('unread')){ 
      // akt + checked
      if(obj.hasClass('checked')){ 
        // akt + checked + hover     
        obj.addEvent('mouseover',function(){ obj.addClass('checked_hover'); });
        obj.addEvent('mouseout',function(){ obj.removeClass('checked_hover'); });
        // alt + !checked  
      } else {
        // akt + hover
        obj.addEvent('mouseover',function(){ obj.addClass('unread_hover'); });
        obj.addEvent('mouseout',function(){ obj.removeClass('unread_hover'); });
      }

    //przeczytane
    } else {
      //hover
      obj.addEvent('mouseover',function(){ obj.addClass('hover'); });
      obj.addEvent('mouseout',function(){ obj.removeClass('hover'); });
    }
  },

  // przyciski "zaznacz wszystkie" i "odznacz wszystkie"
  select_all_none : function (stan) {
    var that = this;
    // zaznacz
    if (stan) {
      $$('#mail_form li.row').each(function(row){
        $(row).getElements('input').setProperty('checked','checked');
        row.addEvent('mouseover',function(){ row.addClass('checked_hover'); });
        row.addEvent('mouseout',function(){ row.removeClass('checked_hover'); });
        row.addClass('checked');
      });
    // odznacz
    } else {
      $$('#mail_form li.row').each(function(row){
        $(row).getElements('input').setProperty('checked','');
        row.removeEvents();
        row.removeClass('checked');
        that.remove_hovers(row);
        that.add_hovers(row);
      });
    }
  },

  delete_message : function (el) {
    this.select_all_none(false);
    el.getParent('li').getElements('input').setProperty('checked','checked');
    this.activities1.selectedIndex=1;
    this.activities2.selectedIndex=0;
    this.form.submit();
  },

  // dodaj eventy dla każdego wiersza podczas inicjalizacji
  process_table : function () {
    // nagłówek "kosz" lub "usun"
    this.prepare_dust_bin_text();
    var kosz = new Element('div', {
      'class': 'kosz',
      'text': this.dust_bin_text
    });
    naglowek = $('mail_coolbox').getElement('li.thead');
    kosz.injectInside(naglowek);
    var that = this;
    $$('#mail_form li.row').each(function(row){
      that.add_hovers(row);
      $(row).getElements('input').addEvent('click',function(event){ 
        if(row.hasClass('checked')){
          row.removeEvents(); 
          row.removeClass('checked');
          that.remove_hovers(row);
          that.add_hovers(row);
        } else {
          row.addEvent('mouseover',function(){ row.addClass('checked_hover'); });
          row.addEvent('mouseout',function(){ row.removeClass('checked_hover'); });
          row.addClass('checked');
        } 
      });
      // dodaj naglowek i button dla kosza
      var button = new Element('button', {
        'events': {
          'click': function(e){
            that.delete_message(e.target);
          }.bindWithStopEvent()
        },
        'title' : that.dust_bin_text
      });
    
      var src = row.hasClass('unread') ? getStaticUri('/img/delete_green') : getStaticUri('/img/delete');
      var img = new Element('img', {
        'src': src,
        'alt': that.dust_bin_text
      });
      button.injectInside(row.getElement('div.dust_bin'));
      img.inject(button, 'top'); 
    });
  }
});

window.addEvent("load",function(){
  var MG = new MailsGeneral();
  MG.process_table();
  MG.prepare_select_buttons();
  MG.prepare_activities_selectboxes();
});
