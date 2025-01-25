const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const mainpage_template = fs.readFileSync("./events.html").toString()
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
        if(!userdata) {
            res.redirect("/login")
            return;
        }
        apply("imie", userdata.first)
        apply("nazwisko", userdata.last)
        apply("id", userdata.id)
        apply("photo_path", userdata.photo_path)
        apply("city", userdata.city)
        apply("friends_count", utils.getFriendCount(userdata))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        // last eventy
        let users = JSON.parse(JSON.stringify(prv.pullJSON("users")))
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
        if(!addedEvents) {
            eventsHTML = "Nie masz żadnych powiadomień."
        }
        code = code.replace(`<!--openk_events-->`, eventsHTML)

        code = utils.fillSchools(code, userdata)
        code = utils.fillForums(code, userdata, users)

        res.send(code);
    }
}