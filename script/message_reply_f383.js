window.addEvent("domready_nk", function() {
  function message_reply_build_quote(element)
  {
    if (element.nodeType == 3) { //tekst
      return element.nodeValue;
    }
    var i = 0;
    var res = '';
    if (element.nodeName == 'BLOCKQUOTE') {
      var author = element.childNodes[i].childNodes[0].childNodes[0].nodeValue; //XXX
      i++;
      res = '[cytat ' + author + ']';
    }
    
    var children = element.childNodes;

    for (; i < children.length; i++) {
      res += message_reply_build_quote(children[i]);
    }
    if (element.nodeName == 'IMG') {
      res += element.alt;
    }
    if (element.nodeName == 'BLOCKQUOTE') {
      res += '[koniec]';
    }
  
    return res;
  }
  
  function quote_at_cursor(element, value) 
  {
    try {
      if (document.selection) {
        element.focus();
        sel = document.selection.createRange();
        sel.text = value;
      }
      else if (element.selectionStart || element.selectionStart == '0') {
        var startPos = element.selectionStart;
        var endPos = element.selectionEnd;
        element.value = element.value.substring(0, startPos)
          + value
          + element.value.substring(endPos, element.value.length);
      } else {
        element.value = value + element.value;
      }
    } catch(e) {}
  }
  
  // tylko gdy jest boks do odpowiedzi
  var reply_box = $("reply_box");
  if( reply_box != null ) {
    
    button = nk.misc.create_button('Cytuj');
    button.id = 'btn_messagequote';
   
    var buttons = $("content_main").getElement('#regular_mail_view .actions form.remove_message fieldset');
    buttons.insertBefore(button, buttons.firstChild);

     $("btn_messagequote").addEvent('click', function(e) {
       e.stop();

       var content = $("message_body");
       var textarea = reply_box.getElement("textarea");

       var s = '[cytat ' + sender_name + ']\n';
       s += message_reply_build_quote(content);
       s += '[koniec]\n';
       
       quote_at_cursor(textarea, s);

       textarea.fireEvent('quote', s);

       return false;
     });
  }

})
