var MootoolsMisc = new Class({
  create_button : function (label) {
    var button = new Element('button', {'class' : 'type_1'});
    var table = new Element('table');
    var tbody = new Element('tbody');
    var row = new Element('tr');
    row.adopt(
      new Element('td', {'class' : 'btn_l'}),
      new Element('td', {'class' : 'btn_m', 'text' : label}),
      new Element('td', {'class' : 'btn_r'})
    );
    tbody.adopt(row);
    table.adopt(tbody);
    button.adopt(table);
    return button;
  },
  
  smart_substring : function (string, start, stop) {
    var new_start = 0;
    var new_stop = stop;
    if (start > 0) {
      for (var i=start; new_start == 0 && i < stop; i++) {
        if (string.charAt(i) == ' ') {
          new_start = i+1;
        }
      }
    }
    if (new_stop < string.length) {
      for (var j=stop; new_stop == stop && j > new_start; j--) {
        if (string.charAt(j) == ' ') {
          new_stop = j;
        }
      }
    }
    return string.substring(new_start, new_stop);
  },
  
  format_date : function (date_string) {
    var my_date_time = date_string.split(' ');
    var my_date = my_date_time[0].split('.');
    var formatted_date = new Date();
    formatted_date.setDate(my_date[0]);
    formatted_date.setMonth(my_date[1]-1);
    formatted_date.setFullYear(my_date[2]);
    if (formatted_date.is_today()) {
      return 'dzisiaj ' + my_date_time[1];
    }
    if (formatted_date.is_yesterday()) {
      return 'wczoraj ' + my_date_time[1];
    }
    return date_string;
  },
  
  open_window : function (url, name, width, height, options) {
    var left = (screen.width - width) / 2;
    var top = (screen.height - height) / 2;
    if (!options) {
      options = 'status=no,toolbar=no,location=no,menubar=no,resizable=no,scrollbars=no,height='+height+',width='+width+',left='+left+',top='+top;
    }
    window.open(url, name, options);
  }  
});
