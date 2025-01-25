function opacity(id, opacStart, opacEnd, millisec) 
{    
    var speed = Math.round(millisec / 100);
    var timer = 0;

    //ustalenie 'kierunku' efektu. jesli start i end sa takie same - nic sie nie dzieje    
    if(opacStart > opacEnd) {
        for(i = opacStart; i >= opacEnd; i--) {
            setTimeout("changeOpac(" + i + ",'" + id + "')",(timer * speed));
            timer++;
        }
    } else if(opacStart < opacEnd) {
        for(i = opacStart; i <= opacEnd; i++)
            {
            setTimeout("changeOpac(" + i + ",'" + id + "')",(timer * speed));
            timer++;
        }
    }
}

//dostosowanie do innych przegladarek
function changeOpac(opacity, id) 
{
    var object = document.getElementById(id).style;
    object.opacity = (opacity / 100);
    object.MozOpacity = (opacity / 100);
    object.KhtmlOpacity = (opacity / 100);
    object.filter = "alpha(opacity=" + opacity + ")";
}
