MightKnowInfoBox = new Class({
  
  render: function(info) {
    var box = new Element('div',{'class': 'might_know_info_box'});
        box.innerHTML = info;        
    return box;
  }
});
