$(window).addEvent('domready_nk', function() {
  var boxes = $('content_boxes'), slot = $('sledzik_promo');
  if(slot) {    
    new SledzikPromotedSlot().catch_box(slot);    
  }
  if(boxes) {
    var friends = boxes.getElement('ul.sledzik_followers'), promoted = boxes.getElement('div.sledzik_celebrities_stars.celebrites_box');
    
    if(friends) {
      new SledzikFriendsBox().catch_box(friends);
    }
    if(promoted) {      
      new SledzikPromotedBox().catch_box(promoted);
    }
  }
});
