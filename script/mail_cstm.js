function markAll() {
    var s = document.getElementsByTagName("input")
    for(var e in s) {
        try {
            e = s[e]
            if(e.getAttribute("type") == "checkbox") {
                e.setAttribute("checked", "")
                e.checked = true;
            }
        }
        catch(error) {}
    }
}
function unmarkAll() {
    var s = document.getElementsByTagName("input")
    for(var e in s) {
        try {
            e = s[e]
            if(e.getAttribute("type") == "checkbox") {
                e.removeAttribute("checked")
                e.checked = false;
            }
        }
        catch(error) {}
    }
}
function sendMarkedEvent(e) {
    var event = ""
    var checkedPosts = []
    var s = e.getElementsByTagName("option")
    for(var d in s) {
        try {
            d = s[d]
            if(d.selected) {
                event = d.getAttribute("value")
            }
        }
        catch(error) {}
    }
    s = document.getElementsByTagName("input")
    for(var d in s) {
        try {
            d = s[d]
            if(d.checked) {
                checkedPosts.push(d.getAttribute("value"))
            }
        }
        catch(error) {}
    }
    checkedPosts = checkedPosts.join(",")

    if (window.XMLHttpRequest) {
        r = new XMLHttpRequest()
    } else {
        r = new ActiveXObject("Microsoft.XMLHTTP");
    }
    r.open("GET", "/static_post_action?posts=" + checkedPosts + "&event=" + event + "&c=" + Math.random())
    r.send(null)
    r.onreadystatechange = function(e) {
        if(r.readyState == 4 || this.readyState == 4 || e.readyState == 4) {
            location.reload()
        }
    }
}