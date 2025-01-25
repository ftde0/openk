const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")

const profile_template = fs.readFileSync("./profile.html").toString()
const profile_template_sledzik = fs.readFileSync("./sledzik_profile.html").toString()
const gallerypage_template = fs.readFileSync("./galeria.html").toString()
const friendspage_template = fs.readFileSync("./profile_friends.html").toString()
const invites_template = fs.readFileSync("./show_invites.html").toString()

module.exports = {
    "gen_profile": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("profile/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]

        if(id == "edit") {
            res.redirect("/profile_edit/dane")
            return;
        }

        let users = prv.pullJSON("users")
        let account = users.filter(s => s.id == id)
        let profile_comments = prv.pullJSON("profile_comments")
        if(account[0]) {account = account[0]} else {utils.sendStatus(req, res, 404);return;}
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        let code = profile_template;
        let isSledzik = false;
        if(req.originalUrl.includes("sledzik/profile")) {
            code = profile_template_sledzik;
            isSledzik = true;
        }
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content))
                         .split(`"`).join("&quot;")
                    )
        }

        // podstawowe dane

        let userAge = Date.now() - new Date(account.dob).getTime()
        userAge = userAge / (1000 * 60 * 60 * 24 * 365)
        userAge = Math.floor(userAge)

        let photoId = account.photo_path
        let photoPath = account.photo_path
        let photoLink = "#"
        if(!photoPath.includes("brak")) {
            photoId = photoPath.split("/user_assets/")[1].split(".")[0]
            photoPath = "/get_thumb?id=" + photoId
            photoLink = "/photo/" + photoId
        }

        apply("first", account.first)
        apply("last", account.last)
        apply("name", account.first + " " + account.last)
        apply("gender", account.gender)
        apply("city", account.city)
        apply("photo_path", photoPath)
        apply("photo_link", photoLink)
        apply("age", userAge)
        apply("id", id)
        apply("own_friends_count", utils.getFriendCount(self))
        apply("friends_count", utils.getFriendCount(account))
        apply("own_id", self.id)
        apply("own_name", self.first)

        let artificial = ""
        if(account.fictional == 1) {
            artificial = templates.artificial
        }
        code = code.split(`<!--openk_artificiality-->`).join(artificial)

        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        if(follows.following.includes(account.name)) {
            code = code.replace(
                `<!--openk_sledzik_follow-->`,
                templates.profileSledzikFollow.b(id)
            )
        } else {
            code = code.replace(
                `<!--openk_sledzik_follow-->`,
                templates.profileSledzikFollow.a(id)
            )
        }

        if(isSledzik && account.id == self.id) {
            // oznacz .active tab "mój profil" na śledziku
            code = code.replace(`openk_show_active_if_own`, `active`)
        }

        // śledzik

        let sledzikHTML = ""
        let sledzikPosts = prv.pullJSON("sledzik", {"sender_id": id}, true)
        sledzikPosts.slice(0, 5).forEach(p => {
            let my = p.sender_id == account.id
            let starred = utils.isLiked(p, account.id)
            sledzikHTML += templates.sledzikPost(p, account, my, starred, isSledzik)
        })
        if(sledzikPosts.length == 0) {
            code = code.replace(
                `<!--openk_rm_s_if_unavail`, ""
            ).replace(
                `openk_rm_s_if_unavail_end-->`, ""
            )
        }
        code = code.replace(
            `<!--openk_sledzik-->`,
            sledzikHTML
        )

        // znajomi

        let friendsList = []
        account.friend_ids.split(",").forEach(f => {
            if(f !== account.id) {
                let friendObj = users.filter(s => s.id == f)[0]
                friendsList.push(friendObj)
            }
        })
        let friendsHTML = ""
        friendsList.slice(0, 4).forEach(friend => {
            friendsHTML += templates.friendAvatar(friend)
        })
        code = code.replace(
            `<!--openk_friends_list-->`,
            friendsHTML
        )

        // zaproszenie
        switch(req.query.invited) {
            case "1": {
                code = code.replace(
                    `<!--openk_notification-->`,
                    templates.notifications.invited
                )
                break;
            }
            case "2": {
                code = code.replace(
                    `<!--openk_notification-->`,
                    templates.notifications.invite_error
                )
                break;
            }
            case "3": {
                code = code.replace(
                    `<!--openk_notification-->`,
                    templates.notifications.added
                )
                break;
            }
        }

        // komentarze do profilu

        let comments = profile_comments.filter(s => s.to == account.id)
        let commentsHTML = ""
        comments.forEach(c => {
            let author = users.filter(s => s.name == c.name)[0]
            commentsHTML += templates.profileComment(c, author)
        })
        code = code.replace(
            `<!--openk_user_comments-->`,
            commentsHTML
        )

        // o sobie/aktualne zajęcie
        let aboutme = ""
        let currently = ""
        let additionals = prv.pullJSON(
            "additional_fields", {"name": account.name}, true
        )
        if(additionals[0]) {
            aboutme = utils.xss(additionals[0].aboutme).split("_lbr_").join("<br>")
            currently = utils.xss(additionals[0].currently).split("_lbr_").join("<br>")
        }
        code = code.replace(`<!--openk_aboutme-->`, aboutme)
        code = code.replace(`<!--openk_currently-->`, currently)

        // szkoły do których osoba szła
        code = utils.fillSchools(code, account)

        res.send(code)
    },

    "add_comment": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("profile/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        let matches = prv.pullJSON("users", {"id": id}, true)
        if(!matches[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        if(!req.body || !req.body.toString()
        || !req.body.toString().includes("content=")) {
            res.sendStatus(400)
            return;
        }

        let content = decodeURIComponent(
            req.body.toString().split("content=")[1].split("&")[0]
        ).split("\r").join("").split("\n").join("_lbr_").split("+").join(" ")
        content = utils.xss(content)

        prv.insert("profile_comments", {
            "name": utils.getAuth(req),
            "to": id,
            "content": content,
            "time": Date.now()
        }, true)
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "profile_comment",
            "time": Date.now()
        }, true)

        let redirUrl = "/profile/" + id
        if(req.body.toString().includes("source=sledzik")) {
            redirUrl = "/sledzik/profile/" + id
        }

        res.redirect(redirUrl)
    },

    "profilepage_galleries": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("profile/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        let matches = prv.pullJSON("users", {"id": id}, true)
        let self = prv.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]
        if(!matches[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        matches = matches[0]
        let code = gallerypage_template;

        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        apply("id", id)
        apply("name", matches.first + " " + matches.last)
        apply("own_name", self.first)
        apply("own_id", self.id)
        apply("friends_count", utils.getFriendCount(matches))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply(
            "gallery_header",
            `Galeria: Galeria użytkownika ${matches.first} ${matches.last}`
        )
        code = code.replace(
            `<!--openk_gallery_path-->`,
            templates.userGalleryPath(matches)
        )

        // add photos html
        let photos = prv.pullJSON("photos", {"sender": matches.name}, true)
        let photosHTML = ""
        photos.forEach(p => {
            photosHTML += templates.galleryPage_photo(p, matches)
        })
        code = code.replace(
            `<!--openk_photos_html-->`,
            photosHTML
        )

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "profilepage_friends": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("profile/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        
        let code = friendspage_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = prv.pullJSON("users")

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let target = users.filter(s => s.id == id)
        if(!target) {
            utils.sendStatus(req, res, 404)
            return;
        }
        target = target[0]

        // basic data
        if(self.id == id) {
            apply("friends_string", "Twoi znajomi")
        } else {
            apply(
                "friends_string",
                "Znajomi użytkownika " + target.first + " " + target.last
            )
        }

        apply("own_name", self.first)
        apply("name", target.first + " " + target.last)
        apply("own_id", self.id)
        apply("friends_count", utils.getFriendCount(target))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        
        // friends HTML
        let ids = target.friend_ids.split(",")
        ids.shift()
        if(ids[ids.length - 1] == "") {
            ids.pop()
        }
        let friends = users.filter(s => ids.includes(s.id))
        let friendsHTML = ""
        friends.forEach(f => {
            friendsHTML += "<td>" + templates.friendAvatar(f) + "</td>"
        })
        if(friendsHTML.length == 0) {
            // no friends
            friendsHTML = "<i>Ten użytkownik nie ma znajomych.</i>"
        }
        code = code.replace(`<!--openk_friends_list-->`, friendsHTML)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "sendFriend": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("invite/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let target = users.filter(s => s.id == id)
        let invites = prv.pullJSON("friend_invites")
        if(!target[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        target = target[0]
        let inviteSent = invites.filter(s => (
            s.from == utils.getAuth(req) && s.to == target.name
        ))
        if(!utils.getUserFriends(self).includes(id)
        && !inviteSent[0]
        && self.id !== target.id) {
            prv.insert("friend_invites", {
                "from": utils.getAuth(req),
                "to": target.name,
                "time": Date.now()
            }, true)
            prv.insert("mail", {
                "from": utils.getAuth(req),
                "to": target.name,
                "topic": "_def_friend_invite_",
                "content": "_profile-" + utils.getAuth(req) + "_",
                "time": Date.now(),
                "read": "0",
                "state": "inbox"
            }, true)
            res.redirect("/profile/" + id + "?invited=1")
        } else {
            res.redirect("/profile/" + id + "?invited=2")
        }
    },

    "acceptFriend": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("invite/accept/")[1]
                    .split("/")[0].split("?")[0];

        // make sure the inviting user exists
        let users = prv.pullJSON("users")
        let inviter = users.filter(s => s.id == id);
        if(!inviter[0]) {res.sendStatus(400);return;}
        inviter = inviter[0]
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        // make sure the invite exists
        let invites = prv.pullJSON("friend_invites")
        let invite = invites.filter(s => 
            (s.to == utils.getAuth(req) && s.from == inviter.name)
        )
        if(!invite[0]) {res.sendStatus(400);return;}

        // delete invite, add friend_ids to each
        invite = invite[0]
        prv.delete("friend_invites", invite)
        
        let inviterFriends = inviter.friend_ids
        let selfFriends = self.friend_ids
        if(inviterFriends.endsWith(",")) {
            inviterFriends += self.id
        } else {
            inviterFriends += "," + self.id
        }
        if(selfFriends.endsWith(",")) {
            selfFriends += inviter.id
        } else {
            selfFriends += "," + inviter.id
        }
        prv.update("users", {"id": inviter.id}, {"friend_ids": inviterFriends})
        prv.update("users", {"id": self.id}, {"friend_ids": selfFriends})

        res.redirect("/profile/" + inviter.id + "?invited=3")
    },

    "genFriendRequests": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        // make sure the inviting user exists
        let users = prv.pullJSON("users")
        let invites = prv.pullJSON("friend_invites")

        let code = invites_template;
        
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

        // invity OD
        let invitesFrom = invites.filter(s => s.from == utils.getAuth(req))
        let invitesFromHTML = ""
        invitesFrom.forEach(i => {
            let targetUser = users.filter(s => s.name == i.to)[0]
            invitesFromHTML += "<td>" + templates.friendAvatar(
                targetUser, {"inviteOptions": true}
            ) + "</td>"
        })
        if(invitesFromHTML.length < 2) {
            invitesFromHTML = `<p style="padding: 20px 20px">Brak zaproszeń.</p>`
        }
        code = code.replace(`<!--openk_sent_invites-->`, invitesFromHTML)

        // invity DO
        let invitesTo = invites.filter(s => s.to == utils.getAuth(req))
        let invitesToHTML = ""
        invitesTo.forEach(i => {
            let targetUser = users.filter(s => s.name == i.from)[0]
            invitesToHTML += "<td>" + templates.friendAvatar(
                targetUser, {"inviteOptions": true, "inviteAccept": true}
            ) + "</td>"
        })
        if(invitesToHTML.length < 2) {
            invitesToHTML = `<p style="padding: 20px 20px">Brak zaproszeń.</p>`
        }
        code = code.replace(`<!--openk_received_invites-->`, invitesToHTML)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)
        res.send(code)
    },

    "removeFriendRequest": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        if(!req.query.id) {res.sendStatus(400);return;}
        let id = req.query.id

        // make sure the inviting user exists
        let users = prv.pullJSON("users")
        let inviter = users.filter(s => s.id == id);
        if(!inviter[0]) {res.sendStatus(400);return;}
        inviter = inviter[0]

        // make sure the invite exists
        let invites = prv.pullJSON("friend_invites")
        let invite = invites.filter(s => 
            (s.to == utils.getAuth(req) && s.from == inviter.name)
         || (s.to == inviter.name && s.from == utils.getAuth(req))
        )
        if(!invite[0]) {res.sendStatus(400);return;}

        // delete invite
        invite = invite[0]
        prv.delete("friend_invites", invite)
        res.redirect("/show_invites")
    }
}