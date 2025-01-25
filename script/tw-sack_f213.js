/* Simple AJAX Code-Kit (SACK) v1.6.1 */
/* (C) 2005 Gregory Wild-Smith */
/* www.twilightuniverse.com */
/* Software licenced under a modified X11 licence,
   see documentation or authors website for more details */



function sack(file) {
  this.xmlhttp = null;

  this.resetData = function() {
    this.method = "POST";
    this.queryStringSeparator = "?";
    this.argumentSeparator = "&";
    this.URLString = "";
    this.encodeURIString = true;
    this.element = null;
    this.elementObj = null;
    this.requestFile = file;
    this.vars = new Object();
    this.responseStatus = new Array(2);
    this.use_tickets = true;
  };

  this.resetFunctions = function() {
    this.onLoading = function() { };//OPENED
    this.onLoaded = function() { };//HEADERS_RECEIVED
    this.onInteractive = function() { };//LOADING
    this.onCompletion = function() { };//DONE
    this.onError = function() { };
    this.onFail = function() { };
  };

  this.reset = function() {
    this.resetFunctions();
    this.resetData();
  };

  this.createAJAX = function() {
    try {
      this.xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e1) {
      try {
        this.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
      } catch (e2) {
        this.xmlhttp = null;
      }
    }

    if (! this.xmlhttp) {
      if (typeof XMLHttpRequest != "undefined") {
        this.xmlhttp = new XMLHttpRequest();
      } else {
        this.failed = true;
      }
    }
  };

  this.setVar = function(name, value){
    this.vars[name] = Array(value, false);
  };

  this.encVar = function(name, value, returnvars) {
    if (true == returnvars) {
      return Array(encodeURIComponent(name), encodeURIComponent(value));
    } else {
      this.vars[encodeURIComponent(name)] = Array(encodeURIComponent(value), true);
    }
  }

  this.processURLString = function(string, encode) {
    encoded = encodeURIComponent(this.argumentSeparator);
    regexp = new RegExp(this.argumentSeparator + "|" + encoded);
    varArray = string.split(regexp);
    for (i = 0; i < varArray.length; i++){
      urlVars = varArray[i].split("=");
      if (true == encode){
        this.encVar(urlVars[0], urlVars[1]);
      } else {
        this.setVar(urlVars[0], urlVars[1]);
      }
    }
  }

  this.createURLString = function(urlstring) {
    if (this.encodeURIString && this.URLString.length) {
      this.processURLString(this.URLString, true);
    }
    if (urlstring) {
      if (this.URLString.length) {
        this.URLString += this.argumentSeparator + urlstring;
      } else {
        this.URLString = urlstring;
      }
    }
    urlstringtemp = new Array();
    for (key in this.vars) {
      if (false == this.vars[key][1] && true == this.encodeURIString) {
        encoded = this.encVar(key, this.vars[key][0], true);
        delete this.vars[key];
        this.vars[encoded[0]] = Array(encoded[1], true);
        key = encoded[0];
      }

      urlstringtemp[urlstringtemp.length] = key + "=" + this.vars[key][0];
    }
    if (urlstring){
      this.URLString += this.argumentSeparator + urlstringtemp.join(this.argumentSeparator);      
    } else {
      this.URLString += urlstringtemp.join(this.argumentSeparator);
    }
  }

  
  this.parseResponse = function() {
    return eval('('+this.response+')');
  }


  this.runAJAX = function(urlstring, async) {
    if (this.use_tickets) {
      this.setVar('t', GetCookie(nk_options.auth.basic_auth_cookie_name));
    }
    if (typeof async == 'undefined' || async == null) async = true;
    if (this.failed) {
      this.onFail();
    } else {
      this.createURLString(urlstring);
      if (this.element) {
        this.elementObj = document.getElementById(this.element);
      }
      if (this.xmlhttp) {
        var _this = this;
        if (this.method == "GET") {
          totalurlstring = this.requestFile;
          if(this.URLString.length){
            if (totalurlstring.indexOf(this.queryStringSeparator) == -1) {
              var separator = this.queryStringSeparator;
            } else {
              var separator = this.argumentSeparator;
            }
             totalurlstring += separator + this.URLString;
          }
          this.xmlhttp.open(this.method, totalurlstring, true);
        } else {
          this.xmlhttp.open(this.method, this.requestFile, async);
          try {
            this.xmlhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded")
          } catch (e) { }
        }
        try {
          this.xmlhttp.setRequestHeader('IsAjaxy','very');
        }catch(e){
        }
        
        this.xmlhttp.onreadystatechange = function() {
          switch (_this.xmlhttp.readyState) {
            case 1:
              _this.onLoading();
              break;
            case 2:
              _this.onLoaded();
              break;
            case 3:
              _this.onInteractive();
              break;
            case 4:
              _this.response = misc_repair_utf8(_this.xmlhttp.responseText);
              _this.responseXML = _this.xmlhttp.responseXML;
              _this.responseStatus[0] = _this.xmlhttp.status;
              _this.responseStatus[1] = _this.xmlhttp.statusText;

              if (_this.elementObj) {
                elemNodeName = _this.elementObj.nodeName;
                elemNodeName.toLowerCase();
                if (elemNodeName == "input"
                || elemNodeName == "select"
                || elemNodeName == "option"
                || elemNodeName == "textarea") {
                  _this.elementObj.value = _this.response;
                } else {
                  _this.elementObj.innerHTML = _this.response;
                }
              }
              if (_this.responseStatus[0] == "200") {
                _this.onCompletion();
              } else {
                _this.onError();
              }

              _this.URLString = "";
              break;
          }
        };

        this.xmlhttp.send(this.URLString);
      }
    }
  };

  this.reset();
  this.createAJAX();
}
