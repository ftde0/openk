g_gatrack.map = new Array();
g_gatrack.is_overlay = GetCookie('GASO') !== null || location.hash.substr(0,6) == '#gaso=';

/**
 * tworzy identyfikator aktualnie wyswietlanej strony na podstawie pathname, 
 * domyslnie '/' zastepuje przez ':'
 * dla strony głównej jest to 'main' zamiast pustego stringa.
 */
g_gatrack.get_page_id = function() {
  var path = location.pathname;
  path = path.charAt(0) == '/' ? path.substr(1) : path;
  if (path == '') {
    return 'main';
  }
  return path.replace(/\//g,':');
}

g_gatrack.page_id = g_gatrack.get_page_id();

/**
 * zwraca ID elementu lub jego najbliższego przodka
 * jak nic nie znajdzie to zwróci ROOT
 */
g_gatrack.get_group_id = function(elem) {
  if (elem.id) {
    return elem.id;
  } else if (elem.parentNode) {
    return this.get_group_id(elem.parentNode);
  } else {
    return 'ROOT';
  }
}

/**
 * Okresla czy śledzenie jest w ogóle dozwolone dla tej strony
 */
g_gatrack.is_allowed = function() {
  if (this.enabled || this.is_overlay) {
    for (var i = 0; i < this.allowed_pages.length; ++i) {
      if (this.allowed_pages[i] == this.page_id) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Określa czy element jest linkiem i czy nadaje sie do śledzenia
 */
g_gatrack.is_link = function(obj) {
  return obj.nodeType == 1 && obj.nodeName.toUpperCase() == 'A';
}

/**
 * Tworzy unikalny identyfikator dla adresu docelowego
 */
g_gatrack.create_url = function(elem) {
  var url = '/' + this.track_url + '/' + this.page_id + '/' + this.get_group_id(elem) + '/';
  this.map[url] = this.map[url] ? ++this.map[url] : 1;
  var link_id = this.map[url];
  return url + link_id;
}

function GATracker(elem) {
  this.link_ref = elem;
  this.orig_href = elem.href;
  this.orig_onclick = elem.onclick ? elem.onclick : function() { return true; };
  this.update = function(track_url) {
    this.track_url = track_url;
    if (g_gatrack.is_overlay) {
      this.link_ref.href = this.track_url;
    }
  }
  elem.onclick = function() {
    if (g_gatrack.is_overlay) {
      if (this.gatrack.orig_onclick() !== false) {
        // tu symulujemy oryginalne zachowanie linka w zdarzeniu onclick
        document.location = this.gatrack.orig_href;
      }
      return false;
    } else {
      if (typeof(pageTracker) != 'undefined') {
        pageTracker._trackPageview(this.gatrack.track_url);
      }
      return this.gatrack.orig_onclick();
    }
  }
}

/**
 * Iteruje po elemetach w body i modyfikuje odpowiednie linki, 
 * zaczynamy od document.body
 */
g_gatrack.attach = function(elem) {
  if (this.is_link(elem)) {
    var track_url = this.create_url(elem);
    if (typeof(elem.gatrack) == 'undefined') {
      // pierwszy raz operujemy na tym linku
      elem.gatrack = new GATracker(elem);
      elem.gatrack.update(track_url);
    } else {
      // to juz nie pierwsza operacja na linku, aktualizujemy tylko trac_url
      elem.gatrack.update(track_url);
    }
    return;
  }
  var children = elem.childNodes;
  for (var i = 0; i < children.length; ++i) {
    this.attach(children[i]);
  }
}

/**
 * należy ją zawołać po utworzeniu DOM'a lub w onload, 
 * lub w dowolnym momencie po zmodyfikowaniu strony
 */
g_gatrack.init = function() {
  if (this.is_allowed()) {
    this.map = new Array();
    this.attach(document.body);
  }
}

g_gatrack.onload_old = window.onload ? window.onload : function() {};

window.onload = function() {
  g_gatrack.onload_old();
  g_gatrack.init();
}
