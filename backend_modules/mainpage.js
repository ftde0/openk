const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const mainpage_template = fs.readFileSync("./mainpage.html").toString()
module.exports = {
    "gen": function(req, res) {
        let userdata = JSON.parse(JSON.stringify(prv.pullJSON("users", {
            "name": utils.getAuth(req)
        }, true)))[0]
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        let code = mainpage_template;
        apply("imie", userdata.first)
        apply("nazwisko", userdata.last)
        apply("id", userdata.id)
        apply("photo_path", userdata.photo_path)
        apply("city", userdata.city)
        apply("friends_count", utils.getFriendCount(userdata))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        // latest śledzik
        let sledzikHTML = ""
        let sledzik = JSON.parse(JSON.stringify(prv.pullJSON("sledzik")))
        let users = JSON.parse(JSON.stringify(prv.pullJSON("users")))
        let comments = []
        sledzik.slice(0, 6).forEach(post => {
            if(!post.is_comment) {
                let author = users.filter(s => s.id == post.sender_id)[0]
                let html = templates.sledzikPost(
                    post, author,
                    author.name == utils.getAuth(req),
                    utils.isLiked(post, userdata.id)
                )
                sledzikHTML += html;
            } else {
                comments.push(post)
            }
        })
        comments.forEach(comment => {
            // render
            let author = users.filter(s => s.id == comment.sender_id)[0]
            let html = templates.sledzikComment(
                comment, author, comment.is_comment
            )
            sledzikHTML = sledzikHTML.replace(
                `<!--openk_comments_${comment.is_comment}-->`,
                html
            )
        })
        code = code.replace(`<!--openk_sledzik_html-->`, sledzikHTML)

        // znajomi
        let friends = []
        let tFriends = utils.getUserFriends(userdata)
        tFriends.forEach(t => {
            friends.push(users.filter(s => s.id == t)[0])
        })

        // ostatnie zdjęcia
        let photosArray = []
        let lastPhotos = prv.pullJSON("photos")
        lastPhotos.slice(0, 10).forEach(p => {
            let friend = friends.filter(s => s.name == p.sender)
            if(friend[0]) {
                photosArray.push(p)
            }
        })
        let photosHTML = templates.lastPhotos(photosArray, users, true)
        if(photosHTML.length < 2) {
            let h = "Ta lista zdjęć jest pusta."
            if(utils.getFriendCount(userdata) == 0) {
                h = "Twoja lista znajomych jest pusta."
            }
            photosHTML = `${h} <a href="/search">Znajdź swoich znajomych!</a>`
        }
        code = code.replace(
            `<!--openk_friend_photos_html-->`,
            photosHTML
        )

        // last eventy
        let eventsHTML = ""
        let addedEvents = 0;
        let lastFriendEvents = utils.getLastEvents(users, userdata)
        lastFriendEvents.forEach(e => {
            let date = new Date(parseInt(e.time))
            if(date.getDate() == new Date().getDate()) {
                let source = users.filter(s => s.name == e.name)[0]
                if(e.type.includes("sledzik_star_")) {
                    eventsHTML += templates.starEvent(e, source)
                    addedEvents++
                }
                switch(e.type) {
                    case "photo_upload": {
                        addedEvents++
                        eventsHTML += templates.galleryEvent(e, source)
                        break;
                    }
                }
            }
        })
        code = code.replace(`<!--openk_events-->`, eventsHTML)
        if(addedEvents > 0) {
            code = code.replace(`openkevents`, `style="display: none;"`)
        }

        code = utils.fillSchools(code, userdata)
        code = utils.fillForums(code, userdata, users)

        res.send(code);
    }
}