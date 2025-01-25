var BlogRequest = new Class({
  entries_ids : [],
  
  initialize : function () {
    var previous_entry = $('previous_entry_id');
    var next_entry = $('next_entry_id');
    if (previous_entry) {
      this.entries_ids.include(previous_entry.get('html'));
    }
    if (next_entry) {
      this.entries_ids.include(next_entry.get('html'));
    }
    this.entries_ids.include($('current_entry_id').get('html'));
  },
  
  get_next_id : function (current_id) {
    var next_id = null;
    this.entries_ids.each(function (item, index, entries) {
      if (item == current_id) {
        next_id = entries[index+1];
      }
    });
    return next_id;
  },
  
  get_previous_id : function (current_id) {
    var previous_id = null;
    this.entries_ids.each(function (item, index, entries) {
      if (item == current_id) {
        previous_id = entries[index-1];
      }
    });
    return previous_id;
  },
  
  get_next_entry : function () {
    var next_entry_id = this.get_next_id($('current_entry_id').get('html'));
    if (next_entry_id) {
      this.send_request(next_entry_id);
    }
  },
  
  get_previous_entry : function () {
    var prev_entry_id = this.get_previous_id($('current_entry_id').get('html'));
    if (prev_entry_id) {
      this.send_request(prev_entry_id);
    }
  },
  
  send_request: function (entry_id) {
    var that = this;
    var blog_div = $('demo_entry_content');    
    var request = new Request.NK({
      url : '/blog/'+nk_options.blog.main_blog_name+'/ajax_normal/' + entry_id,
      method : 'get',
      onSuccess : function (responseJSON, responseText) {
        var tween = blog_div.get('tween', {property: 'opacity'});
        tween.start(0).chain(function() {
          var whole_response = new Element('div', { 'html' : responseJSON});
          whole_response.getElements('span.no_entry').each(function(item){
            item.removeClass('hide');
          });
          var long_text = whole_response.getElement('span[id=blog_body_content]').get('html');
          var mootools_misc = new MootoolsMisc();
          var short_text = mootools_misc.smart_substring(long_text, 0, 130);
          if (long_text.length > short_text.length) {
            short_text += ' &hellip;';
          }
          whole_response.getElement('span[id=blog_body_content]').set('html', short_text);
          blog_div.set('html', whole_response.getElement('div[id=demo_entry_content]').get('html'));
          var expand_collapse_link = blog_div.getElement('a.expand_collapse');
          if (long_text.length <= short_text.length) {
            expand_collapse_link.setStyle('display', 'none');
          }
          var date_span = blog_div.getElement('span.date');
          date_span.set('html', mootools_misc.format_date(date_span.get('text').trim()).replace(' ', ' <em>')+'</em>'); 

          var text = blog_div.getElement('span[id=blog_body_content]');
          
          expand_collapse_link.set('html', '(rozwiń <span class="arrow_down"></span>)');
          box_collapsed = true; // glupi hack dla IE6 :/
          expand_collapse_link.addEvent('click', function (event) {
            event.stop();
            if (box_collapsed) {
              text.set('html', long_text);
              this.set('html', '(zwiń <span class="arrow_up"></span>)');
              box_collapsed = false;
            } else {
              text.set('html', short_text);
              this.set('html', '(rozwiń <span class="arrow_down"></span>)');
              box_collapsed = true;
            }
          });
          
          var previous_entry = $('previous_entry_id');
          var next_entry = $('next_entry_id');
          var cached_previous_entry_id = that.get_previous_id(entry_id);
          var cached_next_entry_id = that.get_next_id(entry_id);
          
          if (previous_entry || cached_previous_entry_id) {
            var previous_entry_id = cached_previous_entry_id || previous_entry.get('html');
            if (!that.entries_ids.contains(previous_entry_id)) {
              that.entries_ids = [previous_entry_id].combine(that.entries_ids);
            }
            new Element('a', {
              'href' : '#blog',
              'html' : '<span>&laquo; </span>poprzedni',
              'id'   : 'previous_entry_link',
              'events' : {
                'click' : function (event) {
                  event.stop();
                  that.get_previous_entry();
                }
              }
            }).inject(blog_div.getElement('div#on_blog_nav'));
          }
          
          if ((previous_entry && next_entry) || (cached_previous_entry_id && cached_next_entry_id)) {
            new Element('span', {
              'class' : 'separator',
              'html' : '|'
            }).inject(blog_div.getElement('div#on_blog_nav'));
          }
          
          if (next_entry || cached_next_entry_id) {
            var next_entry_id = cached_next_entry_id || next_entry.get('html');
            if (!that.entries_ids.contains(next_entry_id)) {
              that.entries_ids.include(next_entry.get('html'));
            }
            new Element('a', {
              'href' : '#blog',
              'html' : 'następny<span> &raquo;</span>',
              'id'   : 'next_entry_link',
              'events' : {
                'click' : function (event) {
                  event.stop();
                  that.get_next_entry();
                }
              }
            }).inject(blog_div.getElement('div#on_blog_nav'));
          }
          tween.start(1);
        });
      },
      onFailure : function () {
        blog_div.set('html', '<p>Nie można pobrać aktualności.</p>');
      }
    });
    request.send();
  }
});

window.addEvent('load', function () {
  blog_request = new BlogRequest();
  blog_request.send_request($('current_entry_id').get('html'));
});
