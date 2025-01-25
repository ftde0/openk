var MailsObserver = new(new Class({
  Implements: [Events, Options],
  
  unread_count: 0,
  
  initialize: function(options)
  {
    this.setOptions(options);
    $(window).addEvent('new_mails', this.get_new_mails.bind(this));
    try {    
      this.get_new_mails(Btab.local.data.unread_count.toInt());
    } catch(e) {}
  },
  
  get_mail: function(id, callback)
  {
    new Request.NK({
      url: '/poczta/' + id +'/js',
      method: 'get',
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          callback(response.DATA, id);          
          this.fireEvent('new_mails', [this.unread_count = Math.max(this.unread_count - 1, 0)]);
          this.fireEvent('read_mails_success',[[id]]);          
        } else {
          
        }
      }.bind(this)
    }).send();
  },
  
  get_mail_list: function(box, offset, limit, callback)
  {
    new Request.NK({
      url: '/poczta/' + (box || 'inbox') + '/get/' + offset + '/' + limit,
      method: 'get',
      onRequest: function() {
        this.fireEvent('loading');
      }.bind(this),
      
      onSuccess: function(response) {
        callback(response.DATA, response.COUNT, response.SHOW_NAWIGATION);
      }.bind(this)
      
    }).send();
  },

  get_new_mails: function(count)
  {
    this.fireEvent('new_mails', [this.unread_count = count]);
  },

  move_mails: function(ids, action)
  {
    new Request.FORM({
      url: '/poczta/move/js',
      data: { 'activities1': action, 'activities2': 'none', 'delete': $type(ids) == 'array' ? ids : [ids]},
      ticket: this.options.tickets.move,
      onRequest: function() {
        this.fireEvent('loading');
      }.bind(this),
      
      onSuccess: function(response) {
        if(response.STATUS == 'OK') {
          this.fireEvent('new_mails', [this.unread_count = Math.max(this.unread_count - ids.length,0)]);
          this.fireEvent(action+ '_mails_success', [ids]);
        } else {

        }
      }.bind(this)
    }).send();
  }
  
}))(nk_options.mails.observer);
