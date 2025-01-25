function form_field_chars_counter() {
  var fields = $$('.countable');
  fields.each(
    function(el, i) {
      var field_id = el.getProperty('id');
      var maxlength = 9999999;
      var maxlength_property = el.getProperty('maxlength');     // from maxlength attribute
      var counter = new Element('span', {'id': 'for_' + field_id + '_chars_counter', 'class': 'chars_counter'});
      counter.injectBefore(el);
      var classes = el.getProperty('class');
      if(classes.contains('maxlength')) {
        var re = new RegExp('.* maxlength_([0-9]*).*');
        maxlength = classes.replace(re,'$1');
        maxlength = maxlength.toInt(); 
      }
      if((maxlength_property > 0) && (maxlength_property != 524288) && (maxlength_property != 2147483647)) {
        maxlength = maxlength_property;
      }
      function set_counter(el) {
        if(el.value.length > maxlength) {
          el.value = el.value.substring(0, maxlength);
        }
        counter.set('text',el.value.length+'/'+maxlength);
      }
           
      el.addEvents({
        keypress: function() {
          set_counter(this);
        },
        keyup: function() {
          set_counter(this);
        },
        focus: function() {
          set_counter(this);
        },
        blur: function() {
          set_counter(this);
        },
        click : function() {
          set_counter(this);
        }
      });
    }
  );
  
}

$(window).addEvent('load', function() {
  form_field_chars_counter();
});
