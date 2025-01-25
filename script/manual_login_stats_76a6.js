ManualLoginStats = new Class({
  
  counters: { keys: 0 },
  
  range: [
    9,          // tab
    20,         // capslock
    27,         // esc
    45,         // insert
    91,92,      // meta
    144,        // numlock
     
    [112, 123], // f1 - f12
    [16, 18],   // shift, ctrl, alt
    [37, 40],   // arrows
    [33, 36]    // page up, page down, end, home
  ],
  
  increment: function(key) {
    ++this.counters[key];
  },
  
  callback: function(event) {
    if(this.range.every(this.ignore, event)){
      this.increment('keys')
    };
  },
  
  ignore: function(el) {
    if($type(el) == "array" && el.length == 2) {
      return this.code < el[0] || this.code > el[1];
    } else {  
      return el == this.code ? false : true;
    }
  },
  
  attach: function(form) {
    form.password.addEvents({
      'keydown' : this.callback.bind(this)
    });
    
    if(!form.manual) {
      var manual = new Element('input', { name: 'manual', type: 'hidden', value: 0 });
      form.appendChild(manual);
    }
    else {
      var manual = form.manual;
    }
    
    form.addEvent('submit', (function() {
      manual.set('value', !! this.counters.keys + 0 );
    }).bind(this));
  }

});

manual_login_stats = new ManualLoginStats();
