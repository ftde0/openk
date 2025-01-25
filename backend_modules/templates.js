const utils = require("./utils")

module.exports = {
    "sledzikPost": function(post, author, my, starred, sledzikLink) {
        return `
    <div class="sledzik_shout ${my ? "my" : ""}" style="z-index: ${post.id};">
        <div class="shout_menu hidden">
            <span class="top"></span>
            <ul>
                <li><a class="send_msg" title="Wyślij wiadomość" href="/poczta/compose/${author.id}">Wyślij wiadomość</a>
                </li>
                <li><a class="report_abuse" title="Zgłoś nadużycie" id="ticket_${post.id}" href="/sledzik/shout/${author.id}/${post.id}/abuse">Zgłoś nadużycie</a>
                </li>
                <li>
                    <form class="remove_followee" method="post" action="/sledzik/followee/remove" accept-charset="UTF-8" id="form8"><input type="hidden" name="auto_form_ticket" value="${author.id}"><input type="hidden" name="__utm_admin" value="ΝO"><input type="hidden" name="user_id" value="${author.id}"><input type="hidden" name="back_link" value="/sledzik/"><button class="dont_followee" title="Nie śledź" onclick="" type="submit"><span>Nie śledź</span></button></form>
                </li>
                <li>
                    <form class="delete_entry" method="post" action="/sledzik/shout/${author.id}/${post.id}/remove" accept-charset="UTF-8" id="form9"><input type="hidden" name="auto_form_ticket" value="${author.id}"><input type="hidden" name="__utm_admin" value="ΝO"><button type="submit" class="hide_out"><span>Ukryj wpis</span></button><input type="hidden" name="back" value="/sledzik/"></form>
                </li>
                <li class="show_link"><span></span>Link do wpisu</li>
            </ul>
        </div>
        <div class="shout_content ">
            <div class="header">
                <span class="more_options right"><span class="hidden">^</span></span>
                <span class="stars right">
                    <a href="/sledzik/shout/${author.id}/${post.id}/star" class="stars_count " title="Zobacz kto lubi ten wpis">
                        (<span class="number_stars">${post.like_count}</span>)
                    </a>
                    <a href="/sledzik/shout/${author.id}/${post.id}/star/add?back=%2F" class="dodaj${starred ? " dodana" : ""}" title="Dodaj gwiazdkę">
                        <span class="more_info cool">Fajne!</span>
                    </a>
                </span>
                <a class="username" title="${utils.s(author.first + " " + author.last)}" href="${sledzikLink ? "/sledzik" : ""}/profile/${author.id}">${utils.s(author.first + " " + author.last)}</a>
                <span class="shout_time">${utils.getRelativeTime(post.time)}</span>
                <span class="shout_source source_nk"></span>
            </div>
            <p class="content parser">${utils.s(post.content)}</p>
            <div class="footer">
                <div class="add_comment dont_show">
                    <span class="icon"></span>
                    <a href="/sledzik/shout/${author.id}/${post.id}/comment" title="pokaż komentarze">Skomentuj</a>
                </div>
                <div class="add_comment_form">
                    <div class="hidden">
                        <span class="comment_char_count" style="visibility: visible;">250</span>
                        <form method="post" action="/sledzik/shout/${author.id}/${post.id}/comment/add" accept-charset="UTF-8" id="form7"><input type="hidden" name="auto_form_ticket" value="${author.id}"><input type="hidden" name="__utm_admin" value="ΝO"><textarea class="comment_text_input" id="form7_content" name="content" rows="5" cols="40"></textarea>
                            <input class="send_button" name="wyslij" type="image" src="/img/blank[3].gif" alt="Wyślij">
                            <input type="hidden" name="return" value="list">
                        </form>
                    </div>
                </div>
                <div class="comments_block small single"><!--openk_comments_${post.id}--></div>
                <div class="toggle hidden">
                    <a href="/sledzik/shout/${post.id}/comment" class="show_more_comments" title="pokaż komentarze">
                        <span class="show_comment">
                            Pokaż więcej komentarzy&nbsp;(<span class="number_comments">-${post.comment_ids.split(",").length}</span>)
                        </span>
                        <span class="hidden_comment">Schowaj komentarze</span>
                    </a>
                </div>
            </div>
        </div>
        <div class="shout_avatar">
            <div class="microavatar"><span class="top"></span><a href="${sledzikLink ? "/sledzik" : ""}/profile/${author.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${author.photo_path}"><span class="inner_marker"></span></a><span class="bottom"></span></div>
        </div>
        <div class="clear"></div>
    </div>`
    },

    "sledzikComment": function(post, author, baseId) {
        return `
      <div class="comment">
        <span class="icon"></span>
        <div class="content">
          <div class="right">
            <span class="datetime">${utils.getRelativeTime(post.time)}</span>
            <a href="/sledzik/shout/${author.id}/${baseId}/comment/${post.id}/abuse" class="abuse" title="Zgłoś nadużycie komentarza" id="ticket_4bd06b88fd52b2035e11744d">&#91;&#33;&#93;</a>
            <span class="placeholder"></span>
          </div>
          <p>
            <span class="comment_author">
              <a class="username" title="${utils.s(author.first + " " + author.last).split("\"").join("&quot;")} href="/profile/${author.id}">${utils.s(author.first + " " + author.last)}:</a>
            </span>
            <span class="comment_content ">
              ${utils.s(post.content)}
            </span>
          </p>
        </div>
      </div>`
    },

    "photoComment": function(post, author, index) {
        let photoId = author.photo_path
        let photoPath = author.photo_path
        if(!photoPath.includes("brak")) {
            photoId = photoPath.split("/user_assets/")[1].split(".")[0]
            photoPath = "/get_thumb?id=" + photoId
        }
        let formattedTime = utils.commentTimeFormatter(post.id)
        let content = utils.s(post.content).split("_lbr_").join("<br>").split("+").join(" ")
        return `<div class="photo_comment" id="comment${index}" style="z-index: 1000;">
        <div class="author">
            <div class="avatar_no_js ">
                <div class="avatar_new_photo avatar_single"><a href="/profile/${author.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}"></a></div><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${author.id}"><span class="avatar_user_name_txt">${utils.s(author.first + " " + author.last)}</span><span class="avatar_user_city">${utils.s(author.city)}</span><span class="avatar_user_info_hover_no_js"><span class="avatar_user_name_txt_hover">${utils.s(author.first + " " + author.last)}</span><span class="avatar_user_city">${utils.s(author.city)}</span></span></a>
                <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${author.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a>
                    <div class="friends_and_gallery_no_js"><a href="/friends/${author.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(author)}</span></a><a href="/profile/${author.id}/gallery" class="avatar_gallery" title="Przejdź do galerii"><img src="/img/avatar_list_gallery.gif" alt="Gal."></a></div>
                </div>
            </div>
            <div class="avatar ">
                <div class="avatar_new_photo avatar_single"><a href="/profile/${author.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}"></a></div>
                <div class="avatar_info">
                    <div class="avatar_user_info"><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${author.id}">${utils.s(author.first + " " + author.last)}</a><span class="avatar_user_city">${utils.s(author.city)}</span></div>
                </div>
                <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${author.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a><a href="/friends/${author.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(author)}</span></a>
                    <div class="avatar_arrow"><img src="/img/avatar_arrow.gif" alt="Rozwiń"></div>
                    <div class="avatar_options"><span class="avatar_close_arrow">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                        <ul class="avatar_options_list">
                            <li><a class="gallery" href="/profile/${author.id}/gallery">Galeria</a></li>
                            <li><a class="gift" href="/gifts/send/${author.id}">Wyślij prezent</a></li>
                            <li class="is_unknown uid_${author.id}">
                                <form action="/invite/${author.id}" method="POST" onmouseover="this.className='hover'" onmouseout="this.className=''"><button class="add" type="submit">Dodaj do znajomych</button><input type="hidden" name="t" value="4bc0ab456664ce9d46ce0b67"></form>
                            </li>
                            <li><a class="common" href="/friends/${author.id}#common">Wspólni znajomi</a></li>
                            <li><a class="eurogabki_give" href="/portfel/podaruj/wybor_platnosci?id_osoby=${author.id}">Podaruj €urogąbki</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="photo_comment_right">
            <p class="datetime">${formattedTime}</p>
            <div class="photo_comment_content">
                <div class="photo_comment_top"><!-- . --></div>
                <p><span class="parser">${content}</span>&nbsp;</p>
                <div class="photo_comment_bottom"><!-- . --></div>

            </div>
            <div class="buttons">
            </div>
        </div>
        <div class="clear"><!-- . --></div>
    </div>`
    },

    "lastPhotos": function(photos, users, bareThumbs) {
        let html = ``
        if(!bareThumbs){
          html = 
        `<div class="cool_box_21 cool_box last_photos_box" id="last_photos_box" style="width: 100%">
          <div class="cool_box_header">
            <div class="cool_box_header_inner">
              <div class="cool_box_header_left">
                <div class="cool_box_limiter"><span class="cool_raquo">&raquo;</span>Ostatnio dodane zdjęcia</div>
              </div>
              <div class="cool_box_header_right"></div>
            </div>
          </div>
          <div class="cool_box_content">
            <div class="cool_box_inner">
              <div id="last_photos" class="last_photos_5">
                <div class="last_rows">`
        }
    
        photos.forEach(p => {
            let author = users.filter(s => s.name == p.sender)[0]
            html += `
          <div class="thumb">
            <div class="outer">
              <div class="middle">
                <div class="inner">
                  <div class="avatar_photo"><a href="/photo/${p.id}"><img alt="miniaturka zdjęcia" class="thumb" src="/get_thumb?id=${p.id}"></a>
                  </div>
                </div>
              </div>
            </div>
            <div class="desc">
              <div class="author"><a href="/profile/${author.id}">${utils.s(author.first + " " + author.last)}</a><br>${utils.getRelativeTime(p.time)}</div>
            </div>
          </div>`
        })
        if(!bareThumbs) {
          html += `
            <div class="clear"></div>
        </div>
      </div>
      <div class="coolbox_bottom">
        <div class="coolbox_hint"><a href="/faq">&nbsp;<span>Zdjęcia ostatnio dodane przez Użytkowników portalu</span></a></div>
      </div>
    </div>
  </div>
</div>`
        }
        return html;
    },

    "friendAvatar": function(user, options) {
      let photoId = user.photo_path
      let photoPath = user.photo_path
      if(!photoPath.includes("brak")) {
          photoId = photoPath.split("/user_assets/")[1].split(".")[0]
          photoPath = "/get_thumb?id=" + photoId
      }
      if(!options) {options = {}}
      return `
    <div class="avatar_no_js ">
      <div class="avatar_new_photo">
        <div class="avatar_middle">
          <div class="avatar_inner"><a href="/profile/${user.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}">${user.fictional == 1 ? this.artificial : ""}</a></div>
        </div>
      </div><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${user.id}"><span class="avatar_user_name_txt">${utils.s(user.first + " " + user.last)}</span><span class="avatar_user_city">${utils.s(user.city)}</span><span class="avatar_user_info_hover_no_js"><span class="avatar_user_name_txt_hover">${utils.s(user.first + " " + user.last)}</span><span class="avatar_user_city">${utils.s(user.city)}</span></span></a>
      <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${user.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a>
        <div class="friends_and_gallery_no_js"><a href="/friends/${user.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(user)}</span></a><a href="/profile/${user.id}/gallery" class="avatar_gallery" title="Przejdź do galerii"><img src="/img/avatar_list_gallery.gif" alt="Gal."></a></div>
      </div>
    </div>
    <div class="avatar ">
      <div class="avatar_new_photo">
        <div class="avatar_middle">
          <div class="avatar_inner"><a href="/profile/${user.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}">${user.fictional == 1 ? this.artificial : ""}</a></div>
        </div>
      </div>
      <div class="avatar_info">
        <div class="avatar_user_info"><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a><span class="avatar_user_city">${utils.s(user.city)}</span></div>
      </div>
      <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${user.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a><a href="/friends/${user.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(user)}</span></a>
        <div class="avatar_arrow"><img src="/img/avatar_arrow.gif" alt="Rozwiń"></div>
        <div class="avatar_options"><span class="avatar_close_arrow">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <ul class="avatar_options_list">
            <li><a class="gallery" href="/profile/${user.id}/gallery">Galeria</a></li>
            <li><a class="gift" href="/gifts/send/${user.id}">Wyślij prezent</a></li>
            <li class="is_unknown uid_${user.id}">
              <form action="/invite/${user.id}" method="POST" onmouseover="this.className='hover'" onmouseout="this.className=''"><button class="add" type="submit">Dodaj do znajomych</button><input type="hidden" name="t" value="4bc0ab62b24dbaf337c92549"></form>
            </li>
            <li><a class="common" href="/friends/${user.id}#common">Wspólni znajomi</a></li>
            <li><a class="eurogabki_give" href="/portfel/podaruj/wybor_platnosci?id_osoby=${user.id}">Podaruj €urogąbki</a></li>
          </ul>
        </div>${options.inviteOptions ? `<div class="avatar_additional_invitations">${options.inviteAccept ? `<a href="/friends_invite_accept?id=${user.id}"><img src="/img/invitation_accept.gif" title="Zaakceptuj zaproszenie"/></a>` : ""}<a href="/friends_invite_remove?id=${user.id}"><img src="/img/invitation_remove.gif" title="Usuń zaproszenie"/></a></div>` : ""}
      </div>
    </div>`
    },
    "profileComment": function(comment, user) {
      let photoId = user.photo_path
      let photoPath = user.photo_path
      if(!photoPath.includes("brak")) {
          photoId = photoPath.split("/user_assets/")[1].split(".")[0]
          photoPath = "/get_thumb?id=" + photoId
      }
      let formattedTime = utils.commentTimeFormatter(comment.time)
      return `
    <div class="comment">
      <table class="comment_table">
        <tbody>
          <tr>
            <td class="avatar_holder" style="z-index: 999;">
              <div class="avatar_no_js " style="display: none;">
                <div class="avatar_new_photo avatar_single"><a href="/profile/${user.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}"></a></div><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${user.id}"><span class="avatar_user_name_txt">${utils.s(user.first + " " + user.last)}</span><span class="avatar_user_city">${utils.s(user.city)}</span><span class="avatar_user_info_hover_no_js"><span class="avatar_user_name_txt_hover">${utils.s(user.first + " " + user.last)}</span><span class="avatar_user_city">${utils.s(user.city)}</span></span></a>
                <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${user.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a>
                  <div class="friends_and_gallery_no_js"><a href="/friends/${user.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(user)}</span></a><a href="/profile/${user.id}/gallery" class="avatar_gallery" title="Przejdź do galerii"><img src="/img/avatar_list_gallery.gif" alt="Gal."></a></div>
                </div>
              </div>
              <div class="avatar " style="display: block;">
                <div class="avatar_new_photo avatar_single"><a href="/profile/${user.id}" title="Pokaż profil"><img alt="Pokaż profil" src="${photoPath}"></a></div>
                <div class="avatar_info">
                  <div class="avatar_user_info"><a title="Przejdź do profilu" class="avatar_user_name" href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a><span class="avatar_user_city">${utils.s(user.city)}</span></div>
                </div>
                <div class="avatar_bar"><a class="avatar_mail" href="/poczta/compose/${user.id}" title="Wyślij wiadomość"><img alt="Napisz wiadomość" src="/img/avatar_mail.gif"></a><a href="/friends/${user.id}" title="Pokaż listę znajomych" class="avatar_friends"><img src="/img/ico_friends.gif"><span>${utils.getFriendCount(user)}</span></a>
                  <div class="avatar_arrow"><img src="/img/avatar_arrow.gif" alt="Rozwiń"></div>
                  <div class="avatar_options" style="display: none;"><span class="avatar_close_arrow">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    <ul class="avatar_options_list">
                      <li><a class="gallery" href="/profile/${user.id}/gallery">Galeria</a></li>
                      <li><a class="gift" href="/gifts/send/${user.id}">Wyślij prezent</a></li>
                      <li class="is_unknown uid_${user.id}">
                        <form action="/invite/${user.id}" method="POST" onmouseover="this.className='hover'" onmouseout="this.className=''"><button class="add" type="submit">Dodaj do znajomych</button><input type="hidden" name="t" value="4bc0ab62b24dbaf337c92549"></form>
                      </li>
                      <li><a class="common" href="/friends/${user.id}#common">Wspólni znajomi</a></li>
                      <li><a class="eurogabki_give" href="/portfel/podaruj/wybor_platnosci?id_osoby=${user.id}">Podaruj €urogąbki</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </td>
            <td class="content">
              <div class="datetime">${formattedTime}</div>
              <div class="comment_strut_y"></div>
              <p class="comment_content">
                <span class="arrow"></span>${utils.s(comment.content).split("_lbr_").join("<br>")}
              </p>
              <div class="clear_right"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`
    },
    "galleryPage_photo": function(photo, user) {
      return `
    <div class="album">
      <table class="thumb_holder">
        <tr>
          <td>
            <a class="album_photo" href="/photo/${photo.id}"><img alt="miniaturka zdjęcia" class="thumb" title="Pokaż zdjęcie" src="/get_thumb?id=${photo.id}"></a>
          </td>
        </tr>
      </table>
      <div class="desc">
        <p>
          <strong>Dodał${user.gender == "F" ? "a" : ""}: </strong><a href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a>
          <br>
          <strong>Data dodania: </strong>${utils.commentTimeFormatter(photo.id)}<br>
          <strong>Opis: </strong> ${utils.s(photo.description)}
        </p>
      </div>
    </div>`
    },
    "lastStarEntry": function(star, user, post) {
      let photoId = user.photo_path
      let photoPath = user.photo_path
      if(!photoPath.includes("brak")) {
          photoId = photoPath.split("/user_assets/")[1].split(".")[0]
          photoPath = "/get_thumb?id=" + photoId
      }
      let formattedTime = utils.getRelativeTime(star.time)
      let shortPost = post.content
      if(shortPost.length > 20) {
        shortPost = shortPost.substring(0, 18) + "..."
      }
      return `
        <ul class="person_list">
            <li>
                <div class="microavatar">
                    <img src="${photoPath}"/>
                </div>
                <div>
                    <a class="user_name" href="/sledzik/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a>
                    <span class="stardate">${formattedTime}</span>
                </div>
                <a href="#" class="star_quote">${utils.s(shortPost)}</a>
            </li>
        </ul>`
    },
    "starEvent": function(star, user) {
      let hTime = ""
      let dTime = new Date(parseInt(star.time))
      hTime += dTime.getHours() < 10 ? "0" + dTime.getHours() : dTime.getHours()
      hTime += ":" + (dTime.getMinutes() < 10 ? "0" + dTime.getMinutes() : dTime.getMinutes())
      return `
      <table class="event">
          <tr>
              <td class="thumb">
              </td>
              <td class="icon">
                  <span><img class="event_icon" src="/img/ico_powiadom_sledz_star.gif" alt="Gwiazdka na wpisie"></span>
              </td>
              <td>
                  <p><a>${utils.s(user.first + " " + user.last)}</a> oznaczył(a) Twój wpis gwiazdką</p>
              </td>
              <td class="time">${hTime}</td>
              <td class="delete">
                  <form class="watchlist_x_form" method="post" action="/events/remove" accept-charset="UTF-8" id="form22"><input type="hidden" name="auto_form_ticket" value="4bd1aef9b69caa2d846ddca0"><input type="hidden" name="__utm_admin" value="ΝO"><input type="hidden" name="back_link" value=""><input type="hidden" name="event_ids" value="${star.time}"><input class="watchlist_x" title="Usuń powiadomienie" onclick="EventsCtrl.attach(this)" type="image" src="/img/ico_x_watchlist.gif" alt="x"></form>
              </td>
          </tr>
      </table>`
    },

    "notifications": {
      "invited": `<div class="notification notification_normal"><span>Zaproszenie zostało wysłane!</span></div>`,
      "invite_error": `<div class="notification notification_wrong"><span>Wystąpił problem podczas wysyłania zaproszenia.</span></div>`,
      "added": `<div class="notification notification_normal"><span>Zaproszenie przyjęte!</span></div>`
    },

    "miniMail": function(mail) {
      return `<div class="regular_mail_view"><div class="message_date_time"><span class="date">${utils.commentTimeFormatter(parseInt(mail.time))}</span><span class="message_subtitle">${utils.s(mail.topic)}</span></div><div class="message_container"><div class="mailbox_navigation"><a class="back_to_xbox" href="#">powrót do wiadomości</a></a><p class="message_body">${mail.content}</p></div></div></div>`
    },

    "galleryEvent": function(event, user) {
      let hTime = ""
      let dTime = new Date(parseInt(event.time))
      hTime += dTime.getHours() < 10 ? "0" + dTime.getHours() : dTime.getHours()
      hTime += ":" + (dTime.getMinutes() < 10 ? "0" + dTime.getMinutes() : dTime.getMinutes())
      return `
    <table class="event photo_evnt">
        <tbody>
            <tr>
                <td class="thumb">
                </td>
                <td class="icon">
                    <span><img alt="Nowe zdjęcie" class="event_icon" src="/img/ico_powiadom_nowezdjecie.gif" title="Nowe zdjęcie"></span>
                </td>
                <td>
                    <p><a onmouseover="return overlib(&quot;<div class=\&quot;event_tip\&quot;><a href=\&quot;\/profile\/15067472\&quot; title=\&quot;Poka\u017c profil\&quot;><img alt=\&quot;Poka\u017c profil\&quot; src=\&quot;http:\/\/photos.nasza-klasa.pl\/16197635\/38\/thumb\/20b6eebb79.jpeg\&quot;><\/a><\/div>&quot;, NOCLOSE, FOLLOWMOUSE, FULLHTML, BORDER, 0, DELAY, 500);" onmouseout="return nd(500);" class="friend" href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a>

                        dodał(a) zdjęcie do <a href="/profile/${user.id}/gallery">swojej galerii</a>
                    </p>
                </td>
                <td class="time">${hTime}</td>
                <td class="delete">
                    <form class="watchlist_x_form" method="post" action="/events/remove" accept-charset="UTF-8" id="form23"><input type="hidden" name="auto_form_ticket" value="4bd1aef9b69caa2d846ddca0"><input type="hidden" name="__utm_admin" value="ΝO"><input type="hidden" name="back_link" value=""><input type="hidden" name="event_ids" value="${event.time}"><input class="watchlist_x" title="Usuń powiadomienie" onclick="EventsCtrl.attach(this)" type="image" src="/img/ico_x_watchlist.gif" alt="x"></form>
                </td>
            </tr>
        </tbody>
    </table>`
    },

    "profileSledzikFollow": {
      "a": function(id) {
        return `<div class="ikonki"><a title="Śledź" href="/sledzik/follow/${id}"><img alt="Śledź" src="/img/profil_button_main_sledz.gif">Śledź</a></div>`
      },
      "b": function(id) {
        return `<div class="ikonki"><a title="Nie śledź" href="/sledzik/follow_remove/${id}"><img alt="Nie śledź" src="/img/profil_button_main_niesledz.gif">Nie śledź</a></div>`
      }
    },

    "schoolClassEntry": function(c, isUser, index, schoolId) {
      return `
      <tr class="empty_row">
          <td colspan="6"></td>
      </tr>
      <tr class="class">
          <td class="icon">${isUser ? `<img src="/img/class_user.gif">` : ""}</td>
          <td class="nr">${index}.</td>
          <td class="name"><a href="/school/${schoolId}/${c.id}">Klasa <strong>${c.name}</strong></a>
          </td>
          <td class="profile"><a href="/school/${schoolId}/${c.id}">${c.profile}</a>
          </td>
          <td class="years">${c.start} – ${c.end}</td>
          <td class="teacher">${c.teacher}</td>
      </tr>`
    },

    "classStudentEntry": function(user, index) {
      let photoId = user.photo_path
      let photoPath = user.photo_path
      if(!photoPath.includes("brak")) {
          photoId = photoPath.split("/user_assets/")[1].split(".")[0]
          photoPath = "/get_thumb?id=" + photoId
      }
      return `
      <div class="student student_expanded">
          <div class="nr nr_collapsed">1</div>
          <div class="student_photo"><a href="/profile/${user.id}"><img src="${photoPath}" alt="zdjęcie ucznia"></a>
          </div>
          <div class="student_info">
              <div class="nr nr_expanded">${index}</div>
              <div class="student_name"><a class="student_link" href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a>
              </div>
              <div class="city">
                  <div class="city_strut_y"></div>
                  <div class="city_content">${utils.s(user.city)}</div>
                  <div class="clear_right"></div>
              </div>
          </div>
          <div class="bottom">
              <div class="buttons">
                  <div class="button"><a title="Wyślij wiadomość" href="/poczta/compose/${user.id}"><img alt="Napisz wiadomość" src="/img/dziennik_wyslijwiadomosc.gif"></a></div>
                  <div class="button"><a title="Pokaż galerię zdjęć" href="/profile/${user.id}/photos"><img alt="Pokaż galerię zdjęć" src="/img/dziennik_galeria.gif"></a></div>
                  <div class="button"><a title="Pokaż znajomych" href="/friends/${user.id}"><img alt="Pokaż znajomych" src="/img/dziennik_znajomi.gif"></a><span class="count">${utils.getFriendCount(user)}</span></div>
              </div>
          </div>
      </div>`
    },

    "classMiniEntry": function(user) {
      return `<li class="user">•&nbsp;<a href="/profile/${user.id}">${utils.s(user.first + " " + user.last)}</a></li>`
    },

    "schoolMin": function(s, index, m) {
      return `
      <li class="school${index == 0 ? " first" : ""}"><span class="fade"></span>
          <div class="school_name"><a class="school" href="/school/${s.id}">${utils.s(s.name)}</a>
          </div>${m ? `<!--openk_classes_${s.id}-->` : ""}
      </li>`
    },

    "classMin": function(classroom, school) {
      return `<li><span class="fade"></span><a class="user_class" href="/school/${school.id}/${classroom.id}">Klasa ${classroom.name} (${classroom.start}-${classroom.end})</a></li>`
    },

    "bzwbk": `<li class="school"><a href="/bankzachodniwbk"><img id="bzwbk_ikona" src="/img/school_bar.jpg" alt="BankZachodni WBK"></a></li>`,

    "class_mini_photo": function(photo, uploader) {
      return `
      <td>
          <div class="thumb">
              <div class="outer">
                  <div class="middle">
                      <div class="inner">
                          <div class="avatar_photo"><a href="/photo/${photo.id}"><img alt="miniaturka zdjęcia" class="thumb" src="/get_thumb?id=${photo.id}"></a></div>
                      </div>
                  </div>
              </div>
              <div class="desc">
                  <div class="author"><a href="/profile/${uploader.id}">${utils.s(uploader.first + " " + uploader.last)}</a><br>${utils.getRelativeTime(photo.time)}</div>
              </div>
          </div>
      </td>`
    },

    "userGalleryPath": function(user) {
      return `
      <a href="/profile/${user.id}">Profil użytkownika</a>
      <span class="raquo">&raquo;</span> <a class="active_path" href="/profile/${user.id}/gallery">Galeria</a>`
    },

    "classPath": function(classroom, school) {
      return `
      <a href="#">${utils.s(school.city)}</a>
      <span class="raquo">&raquo;</span>
      <a href="/school/${school.id}">${utils.s(school.name)}</a>
      <span class="raquo">&raquo;</span>
      <a class="active_path" href="/school/${school.id}/${classroom.id}">Klasa ${utils.s(classroom.name)} (${classroom.start}-${classroom.end})</a>`
    },

    "schoolPath": function(school) {
      return `
      <a href="#">${utils.s(school.city)}</a>
      <span class="raquo">&raquo;</span>
      <a href="/school/${school.id}">${utils.s(school.name)}</a>`
    },

    "forumThread": function(t, index, users) {
      let posts = t.post_ids.split("\x04").join(",").split(",").filter(s => s !== "")
      let lastPost = require("./prvdb").pullJSON("forum_posts")
      lastPost = lastPost.filter(s => s.id == posts[posts.length - 1])[0]
      let lastUser = users.filter(s => s.name == lastPost.name)[0]
      return `
    <tr class="thread_${index}">
        <td class="name"><a name="thread${index}"></a>
            <div class="name"><a href="/forum/${t.id}">${utils.s(t.name)}</a></div>
        </td>
        <td class="count">${posts.length}</td>
        <td class="last_post">
            <div class="last_post"><a href="/forum/${t.id}#post_${lastPost.id}"><span class="demo">${utils.s(t.name)}</span><br>
                <p dir="LTR"><span class="author">${utils.s(lastUser.first + " " + lastUser.last)}</span> <img alt="idź do" src="/img/thread_last_post.png"></p><span class="datetime">${utils.getRelativeTime(lastPost.id)}</span>
            </a></div>
        </td>
    </tr>`
    },

    "forumPost": function(post, user) {
      return `
      <div class="post" id="post_${post.id}">
          <div class="post-frame">
              <div class="profile">
                  ${this.friendAvatar(user)}
              </div>
              <div class="datetime"><span>${utils.getRelativeTime(post.id)}</span></div>
              <div class="post_content">
                  <span>${utils.s(post.content.split("<br>").join("_lbr_").split("\r").join("").split("\n").join("_lbr_")).split("_lbr_").join("<br>")}</span>
              </div>
              <div class="strut_y">
                  <button class="type_1">
                      <table>
                          <tr>
                              <td class="btn_l"></td>
                              <td class="btn_m">Odpowiedz</td>
                              <td class="btn_r"></td>
                          </tr>
                      </table>
                  </button>
                  <button class="type_1">
                      <table>
                          <tr>
                              <td class="btn_l"></td>
                              <td class="btn_m">Cytuj</td>
                              <td class="btn_r"></td>
                          </tr>
                      </table>
                  </button>
              </div>
          </div>
      </div>`
    },

    "sideForum": {
      "unread": function(t, index) {
        return `<li class="unread${index == 1 ? " first" : ""}"><span class="fade"></span><a title="${utils.s(t.name)}" href="/forum/${t.id}">${utils.s(t.name)}</a>
        </li>`
      },
      "read": function(t, index) {
        return `<li class="read${index == 1 ? " first" : ""}"><span class="fade"></span><a title="${utils.s(t.name)}" href="/forum/${t.id}">${utils.s(t.name)}</a>
        </li>`
      }
    },

    "artificial": `<img alt="Profil fikcyjny" class="av_kontofikcyjne" src="/img/av_kontofikcyjne.gif">`,

    "inboxEntry": function(mail, index, from) {
      return `
      <li class="row row-${index} read">
          <div class="border">
              <div class="checkbox"><input type="checkbox" value="${mail.time}"></div>
              <a href="/poczta/msg/${mail.time}"><div class="od">${utils.s(from)}</div>
              <div class="msg">${utils.s(mail.topic)}</div>
              <div class="dust_bin"><button title="Kosz"><img src="/img/delete.png" alt="Kosz"></button></div></a>
          </div>
      </li>`
    }
}