
var mapbox_old_onload = (window.onload ? window.onload : function() { } );

window.onload = function() {
  mapbox_old_onload();
  var divs=document.getElementsByTagName("*");
  for (t = 0; t < divs.length; t++)
  {
    if (divs[t].className != 'mapa')continue;
    var tab=divs[t].getElementsByTagName("area");
    for (i = 0; e = tab[i]; i++)
    {
      var s = e.href.split("/");
      e.href = '/country#show='+parseInt(s[s.length-1]);
    }
  }
}
