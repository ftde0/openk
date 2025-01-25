const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const fs = require("fs")

const inbox_template = fs.readFileSync("./inbox.html").toString()
const inbox_msg_template = fs.readFileSync("./inbox_msg.html").toString()
const inbox_picker_template = fs.readFileSync("./inbox_choose_compose.html").toString()
const inbox_compose_template = fs.readFileSync("./inbox_compose.html").toString()

module.exports = {
    "get_new_mail": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let mail = prv.pullJSON("mail")
        mail = mail.filter(s => s.to == utils.getAuth(req) && parseInt(s.read) == 0)
        res.send({
            "status": "OK",
            "code": 1,
            "unread_count": mail.length,
            "mail_id": 0,
            "content": "0\\n",
            "c": Date.now()
        })
    },

    "get_json_messages": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let mail = prv.pullJSON("mail")
        mail = mail.filter(s => s.to == utils.getAuth(req))
        let users = prv.pullJSON("users")
        let responseMail = []
        let index = 0;
        mail.forEach(m => {
            if(m.state == "inbox") {
                let sender = JSON.parse(
                    JSON.stringify(users.filter(s => s.name == m.from)[0])
                )
                m = JSON.parse(JSON.stringify(m))
                if(m.topic == "_def_friend_invite_") {
                    m.topic = "Zostałeś zaproszony do listy znajomych"
                }
                responseMail.push({
                    "id": m.time,
                    "row_class": "row-" + index,
                    "person": utils.s(sender.first + " " + sender.last),
                    "msg": utils.s(m.topic)
                })
                index++
            }
        })
        res.send({
            "STATUS": "OK",
            "COUNT": responseMail.length,
            "DATA": responseMail,
            "SHOW_NAVIGATION": true
        })
    },

    "get_json_message": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("poczta/")[1].split("/js")[0]
        let mail = prv.pullJSON("mail")
        mail = mail.filter(s => 
            (s.to == utils.getAuth(req) && s.time.toString() == id)
        )
        if(!mail[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        mail[0] = JSON.parse(JSON.stringify(mail[0]))
        if(mail[0].content.includes("_profile-")) {
            let username = mail[0].content.split("_profile-")[1].split("_")
            username.pop()
            username = username.join("_")
            let sender = prv.pullJSON("users")
            sender = sender.filter(s => s.name == username)[0]
            mail[0].topic = "Zostałeś zaproszony do listy znajomych"
            mail[0].content = [
                "Zostałeś zaproszony do listy znajomych przez: ",
                utils.s(sender.first + " " + sender.last),
                `<div class="notification notification_normal">
                <a href="/invite/accept/${sender.id}">Akceptuję zaproszenie</a>
                </div>`
            ].join("")
        } else {
            mail[0].content = utils.s(mail[0].content)
        }
        prv.update("mail", {"time": mail[0].time}, {"read": "1"})
        res.send({
            "STATUS": "OK",
            "DATA": templates.miniMail(mail[0]),
            "c": Date.now()
        })
    },

    "get_last_events": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let lastFriendEvents = utils.getLastEvents(users, self)
        let eventsHTML = ""
        let addedEvents = 0;
        lastFriendEvents.forEach(e => {
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
        })
        eventsHTML = eventsHTML.replace(/\<td class=\"time\">.*\<\/td\>\n/g, "")
        eventsHTML = eventsHTML.replace(/\<form class=\"watchlist_x_form\".*\<\/form>/g, "")
        if(eventsHTML.length < 2) {
            eventsHTML = `<p class="no_events">Lista powiadomień jest pusta</p>`
        }
        res.send({
            "STATUS": "OK",
            "RESPONSE": {
                "content": eventsHTML,
                "count": addedEvents,
                "unwatched_count": 0
            }
        })
    },

    "hide_event": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let notifs = utils.getLastEvents(users, self)
        let hides = prv.pullJSON("notification_hides")
        let event_ids = ""
        if(!req.body
        || !req.body.toString().includes("event_ids=")) {
            res.sendStatus(400)
            return;
        }
        event_ids = req.body.toString().split("event_ids=")[1].split("&")[0]
        if(event_ids.toLowerCase() == "all") {
            notifs.forEach(n => {
                let f = hides.filter(s => (
                    s.from == utils.getAuth(req) && s.id == n.time
                ))
                if(!f[0]) {
                    prv.insert("notification_hides", {
                        "from": utils.getAuth(req),
                        "id": n.time
                    }, true)
                }
            })
        } else {
            let f = hides.filter(s => (
                s.from == utils.getAuth(req) && s.id == event_ids
            ))
            if(!f[0]) {
                prv.insert("notification_hides", {
                    "from": utils.getAuth(req),
                    "id": event_ids
                })
            }
        }

        if(req.originalUrl.includes("/js")) {
            res.send({"STATUS": "OK"})
        } else {
            let redir = req.headers["referer"]
            if(!redir) {
                redir = "/"
            }
            res.redirect(redir)
        }
    },

    "gen_inbox_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let users = JSON.parse(JSON.stringify(prv.pullJSON("users")))

        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let targetState = "inbox"
        let siteHeader = "Wiadomości odebrane"
        if(req.originalUrl.includes("saved")) {
            siteHeader = "Wiadomości zapisane"
            targetState = "saved"
        } else if(req.originalUrl.includes("trash")) {
            targetState = "trash"
            siteHeader = "Kosz"
        } else if(req.originalUrl.includes("outbox")) {
            targetState = "sent"
            siteHeader = "Wiadomości wysłane"
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let code = inbox_template;
        apply("site_header", siteHeader)
        apply("imie", self.first)
        apply("nazwisko", self.last)
        apply("id", self.id)
        apply("photo_path", self.photo_path)
        apply("city", self.city)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        let mail = prv.pullJSON("mail")
        mail = mail.filter(s => s.to == utils.getAuth(req))
        if(targetState == "sent") {
            mail = prv.pullJSON("mail").filter(s => s.from == utils.getAuth(req))
        }
        let mailHTML = ""
        let index = 0;
        mail.forEach(m => {
            let sender;
            let msgMatch = false;
            m = JSON.parse(JSON.stringify(m))
            if(m.state == targetState
            || (targetState == "inbox"
            && (m.state == "inbox" || m.state == "" || !m.state))
            && targetState !== "sent") {
                msgMatch = true;
                sender = JSON.parse(
                    JSON.stringify(users.filter(s => s.name == m.from)[0])
                )
            }
            if(targetState == "sent"
            && m.from == utils.getAuth(req)) {
                msgMatch = true;
                sender = self;
            }
            if(msgMatch) {
                if(m.topic == "_def_friend_invite_") {
                    m.topic = "Zostałeś zaproszony do listy znajomych"
                }
                mailHTML += templates.inboxEntry(
                    m, index, sender.first + " " + sender.last
                )
                index++
            }
        })

        if(index == 0) {
            mailHTML = `<li class="empty_box">W tym folderze nie ma żadnych wiadomości</li>`
        }

        code = code.replace(`<!--openk_mails-->`, mailHTML)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)

        res.send(code);
    },

    "actions_internal": function(posts, state) {
        if(state == "read") {
            posts.forEach(p => {
                prv.update("mail", {"time": p.time}, {"read": "1"})
            })
        } else {
            posts.forEach(p => {
                prv.update("mail", {"time": p.time}, {"state": state})
            })
        }
    },

    "static_actions": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        if(!req.query.posts || !req.query.event) {
            res.sendStatus(400)
            return;
        }
        let posts = req.query.posts.split(",")
        let event = req.query.event;
        let mail = prv.pullJSON("mail")
        let targets = mail.filter(
            s => posts.includes(s.time) && s.to == utils.getAuth(req)
        )
        if(event !== "trash" && event !== "read" && event !== "saved") {
            res.sendStatus(400)
            return;
        }
        this.actions_internal(targets, event)
        res.sendStatus(200)
    },

    "js_actions": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let event = "none"
        let posts = []
        if(req.body.toString()
        && req.body.toString().includes("delete[")) {
            req.body.toString().split("&").forEach(p => {
                let name = p.split("=")[0]
                let value = p.split("=")[1]
                if(name == "activities1") {
                    event = value;
                }
                if(name.startsWith("delete[")) {
                    posts.push(value)
                }
            })
        }
        if(event !== "trash" && event !== "read" && event !== "saved") {
            res.sendStatus(400)
            return;
        }
        let mail = prv.pullJSON("mail")
        let targets = mail.filter(
            s => posts.includes(s.time) && s.to == utils.getAuth(req)
        )
        this.actions_internal(targets, event)
        res.status(200).send({"STATUS": "OK"})
    },

    "static_inbox_read": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        let code = inbox_msg_template;
        let users = prv.pullJSON("users")

        let id = req.originalUrl.split("poczta/msg/")[1]
                    .split("?")[0].split("/")[0]
        let mail = prv.pullJSON("mail")
        mail = mail.filter(s => 
            ((s.to == utils.getAuth(req) || s.from == utils.getAuth(req))
            && s.time.toString() == id)
        )
        if(!mail[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }

        // przygotowujemy mail message pod rendering
        mail = JSON.parse(JSON.stringify(mail))
        mail[0] = JSON.parse(JSON.stringify(mail[0]))
        mail[0].content = `<p class="message_body">${
            utils.s(mail[0].content).split("\n").join("<br>")
        }</p>`

        if(mail[0].to !== utils.getAuth(req)
        && mail[0].from !== utils.getAuth(req)) {
            // tej co tak się zagląda w czyjeś wiadomości
            res.sendStatus(401)
            return;
        }

        if(mail[0].content.includes("_profile-")) {
            let username = mail[0].content.split("_profile-")[1].split("_")
            username.pop()
            username = username.join("_")
            let sender = users.filter(s => s.name == username)[0]
            mail[0].topic = "Zostałeś zaproszony do listy znajomych"
            mail[0].content = [
                "<br>Zostałeś zaproszony do listy znajomych przez: ",
                utils.s(sender.first + " " + sender.last),
                `<div class="notification notification_normal">
                <a href="/invite/accept/${sender.id}">Akceptuję zaproszenie</a>
                </div>`
            ].join("")
        }

        if(mail[0].to == utils.getAuth(req)) {
            prv.update("mail", {"time": mail[0].time}, {"read": "1"})
        }
        
        // apply htmla
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content))
                   .split('"').join("&quot;"))
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        apply("imie", self.first)
        apply("nazwisko", self.last)
        apply("id", self.id)
        apply("photo_path", self.photo_path)
        apply("city", self.city)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        mail = mail[0]

        // wiadomość content
        apply("msg_date", utils.commentTimeFormatter(parseInt(mail.time)))
        apply("msg_topic", mail.topic.split("_lt_").join("<").split("_gt_").join(">"))
        code = code.replace(`<!--openk_msg_content-->`, mail.content)

        let sender = users.filter(s => s.name == mail.from)[0]
        code = code.replace(`<!--openk_sender_avatar-->`, templates.friendAvatar(sender))
        apply("sender_id", sender.id)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)
        res.send(code)
    },

    "inbox_send": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let fields = {}
        if(req.body.toString()) {
            req.body.toString().split("&").forEach(p => {
                let name = p.split("=")[0]
                let value = decodeURIComponent(p).split("=")
                value.shift()
                value = value.join("=")
                        .split("<").join("_lt_")
                        .split(">").join("_gt_")
                        .split("+").join(" ")
                fields[name] = value;
            })
        }
        if(!fields.target || !fields.topic || !fields.msg
        || fields.topic.length > 256 || fields.msg.length > 4000) {
            res.sendStatus(400)
            return;
        }

        let msgId = Date.now()
        let users = prv.pullJSON("users")
        let target = users.filter(s => s.id == fields.target)
        if(!target[0]) {res.sendStatus(400);return;}
        target = target[0]

        prv.insert("mail", {
            "from": utils.getAuth(req),
            "to": target.name,
            "topic": fields.topic,
            "content": fields.msg,
            "time": msgId,
            "read": "0",
            "state": "inbox"
        }, true)

        res.redirect("/poczta/msg/" + msgId)
    },

    "inbox_picker": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        let code = inbox_picker_template;
        let users = prv.pullJSON("users")
        
        // apply htmla
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content))
                   .split('"').join("&quot;"))
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        apply("imie", self.first)
        apply("nazwisko", self.last)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        let friends = utils.getUserFriends(self)
        let friendsListHTML = "<br><ul>"
        friends.forEach(f => {
            let uf = users.filter(s => s.id == f)
            if(uf[0]) {
                let name = utils.s(uf[0].first + " " + uf[0].last)
                let cLink = `/poczta/compose/${uf[0].id}`
                friendsListHTML += `<li><a href="${cLink}">&raquo; ${name}</a></li>`
            }
        })
        friendsListHTML += "</ul>"
        code = code.replace(`<!--openk_people-->`, friendsListHTML)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)
        res.send(code)
    },

    "inbox_compose_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("poczta/compose/")[1]
                    .split("?")[0].split("/")[0]

        let code = inbox_compose_template;
        let users = prv.pullJSON("users")
        
        // apply htmla
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content))
                   .split('"').join("&quot;"))
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        apply("imie", self.first)
        apply("nazwisko", self.last)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        let target = users.filter(s => s.id == id)
        if(!target[0]) {utils.sendStatus(req, res, 404);return;}

        apply("target_id", target[0].id)
        apply("target_name", target[0].first + " " + target[0].last)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)
        res.send(code)
    }
}