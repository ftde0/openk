const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const peoplepage_template = fs.readFileSync("./sledzik_friends.html").toString()
const mainpage_template = fs.readFileSync("./sledzik.html").toString()

module.exports = {
    "addPost": function(req, res) {
        if(!utils.getAuth(req)) {
            res.sendStatus(401)
            return;
        }
        if(!req.body
        || !req.body.toString()
        || !req.body.toString().includes("content=")) {
            res.sendStatus(400)
            return;
        }
    
        let content = utils.xss(decodeURIComponent(
            req.body.toString().split("content=")[1].split("&")[0]
        ))
        let id = prv.pullJSON("sledzik").length || 0
        let sender = prv.pullJSON(
            "users", {"name": utils.getAuth(req)}, true
        )[0]
        prv.insert("sledzik", {
            "id": id,
            "sender_id": sender.id,
            "time": Date.now(),
            "content": content,
            "is_comment": "",
            "comment_ids": "",
            "like_count": "0",
            "like_sources": ""
        }, true)
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "sledzik_post",
            "time": Date.now()
        }, true)
    
        // odpowiedź wymaga HTMLa nowego posta!
        if(req.originalUrl.includes("/js")) {
            res.status(200)
            res.send({"STATUS": "OK", "RESPONSE": {"SHOUT": {
                "id": id,
                "content": templates.sledzikPost(
                    {
                        "id": id,
                        "like_count": "0",
                        "content": content,
                        "comment_ids": "",
                        "time": Date.now()
                    },
                    {
                        "id": sender.id,
                        "first": sender.first,
                        "last": sender.last,
                        "photo_path": sender.photo_path
                    }, true
                ),
            }}})
        } else {
            res.redirect("/")
        }
    },

    "starPost": function(req, res) {
        let shoutId = req.originalUrl.split("shout/")[1].split("/star")[0]
        if(shoutId.includes("/")) {
            shoutId = shoutId.split("/")[1]
        }

        if(!utils.getAuth(req)) {res.sendStatus(401);return;}
        let requestUser = prv.pullJSON(
            "users", {"name": utils.getAuth(req)}, true
        )[0]

        let post = prv.pullJSON("sledzik", {"id": shoutId}, true)[0]
        if(post.like_sources.includes(requestUser.id)) {
            res.send({"STATUS": "ERROR", "RESPONSE": {
                "MSG": "Już dałeś gwiazdkę dla tego wpisu."
            }})
            return;
        }
        prv.update("sledzik", {"id": post.id}, {
            "like_count": parseInt(post.like_count) + 1,
            "like_sources": post.like_sources + requestUser.id + ","
        })
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "sledzik_star_" + post.id,
            "time": Date.now()
        }, true)

        if(req.originalUrl.includes("/js")) {
            res.send({"STATUS": "OK", "RESPONSE": {}})
        } else {
            res.redirect("/")
        }
    },

    "commentPost": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        if(!req.body
        || !req.body.toString()
        || !req.body.toString().includes("content=")) {
            res.status(400)
            res.send(`[openk] brak zawartości komentarza!`)
            return;
        }
        let content = utils.s(
            req.body.toString().split("content=")[1].split("&")[0]
        )
        let basePost = req.originalUrl.split("/comment")[0].split("/")
        basePost = basePost[basePost.length - 1]

        let author = prv.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]
        let id = prv.pullJSON("sledzik").length
        let time = Date.now()
        let post = {
            "id": id,
            "sender_id": author.id,
            "time": time,
            "content": content,
            "is_comment": basePost,
            "comment_ids": "",
            "like_count": "0",
            "like_sources": ""
        }
        prv.insert("sledzik", post, true)
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "sledzik_comment_" + post.id,
            "time": Date.now()
        }, true)

        if(!req.originalUrl.includes("/js")) {
            res.redirect("/")
        } else {
            res.send({
                "STATUS": "OK",
                "RESPONSE": {
                    "NEW_CONTENT": templates.sledzikComment(
                        post, author, basePost
                    ),
                    "COUNT": "1"
                }
            })
        }
    },

    "mainPage": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = mainpage_template
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = prv.pullJSON("users")
        let sledzik = prv.pullJSON("sledzik")
        let events = prv.pullJSON("last_events")

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let ownPosts = []

        // latest śledzik
        let sledzikHTML = ""
        let comments = []
        sledzik.slice(0, 20).forEach(post => {
            if(!post.is_comment) {
                let author = users.filter(s => s.id == post.sender_id)[0]
                let html = templates.sledzikPost(
                    post, author,
                    author.name == utils.getAuth(req),
                    utils.isLiked(post, self.id),
                    true
                )
                sledzikHTML += html;
                if(author.name == utils.getAuth(req)) {
                    ownPosts.push(post)
                }
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

        // ostatnie gwiazdki
        let lastStars = []
        ownPosts.forEach(p => {
            let np = events.filter(s => s.type == "sledzik_star_" + p.id)
            np.forEach(p2 => {
                lastStars.push(p2)
            })
        })
        if(lastStars[0]) {
            let star = lastStars[0]
            let person = users.filter(s => s.name == star.name)[0]
            let post = sledzik.filter(s => s.id == star.type.split("star_")[1])[0]
            code = code.replace(
                `<!--openk_last_star-->`,
                templates.lastStarEntry(star, person, post)
            )
        } else {
            code = code.replace(
                `openk_hide_if_unavail="last_stars"`,
                `style="display: none"`
            )
            code = code.replace(`openkevents`, ``)
        }

        // eventy - gwiazdki v2
        let hides = prv.pullJSON("notification_hides")
        let eventsHTML = ""
        lastStars.forEach(star => {
            let h = hides.filter(s => (
                s.id == star.time && s.from == utils.getAuth(req)
            ))
            let starDate = new Date(parseInt(star.time))
            let cDate = new Date()
            if(starDate.getMonth() == cDate.getMonth()
            && starDate.getDate() == cDate.getDate()
            && starDate.getFullYear() == cDate.getFullYear()
            && !h[0]) {
                let person = users.filter(s => s.name == star.name)[0]
                eventsHTML += templates.starEvent(star, person)
                code = code.replace(`openkevents`, `style="display: none;"`)
            }
        })
        code = code.replace(
            `<!--openk_events-->`,
            eventsHTML
        )
        
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        res.send(code)
    },

    "ajaxPosts": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let startIndex = 0;
        try {
            startIndex = parseInt(
                req.originalUrl.split("shout/list/")[1].split("/")[0]
            )
        }
        catch(error) {}
        if(isNaN(startIndex)) {startIndex = 0;}
        let users = prv.pullJSON("users")
        let sledzik = prv.pullJSON("sledzik")
        let self = users.filter(s => s.name == utils.getAuth(req))
        let responseData = []
        let responseIds = []
        sledzik.slice(startIndex, startIndex + 10).forEach(s => {
            if(!s.id) {s.id = 0;}
            let author = users.filter(u => s.sender_id == u.id)[0]
            responseData.push(templates.sledzikPost(
                s, author, (author.name == utils.getAuth(req)),
                utils.isLiked(s, self.id)
            ))
            responseIds.push(s.id)
        })
        res.send({
            "STATUS": "OK",
            "IDS": responseIds,
            "DATA": responseData
        })
    },

    "lastStar": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        // ostatnie gwiazdki
        let users = prv.pullJSON("users")
        let sledzik = prv.pullJSON("sledzik")
        let events = prv.pullJSON("last_events")
        let ownPosts = []
        let responseHTML = ""

        // latest śledzik
        sledzik.slice(0, 20).forEach(post => {
            let author = users.filter(s => s.id == post.sender_id)[0]
            if(!post.is_comment
            && author.name == utils.getAuth(req)) {
                ownPosts.push(post)
            }
        })

        // ostatnie gwiazdki
        let lastStars = []
        ownPosts.forEach(p => {
            let np = events.filter(s => s.type == "sledzik_star_" + p.id)
            np.forEach(p2 => {
                lastStars.push(p2)
            })
        })
        if(lastStars[0]) {
            let star = lastStars[0]
            let person = users.filter(s => s.name == star.name)[0]
            let post = sledzik.filter(s => s.id == star.type.split("star_")[1])[0]
            responseHTML = templates.lastStarEntry(star, person, post)
        } else {
            responseHTML = `<div style="padding: 10px 10px"><i>brak danych</i></div>`
        }

        // wysyłamy res
        res.send({
            "STATUS": "OK",
            "content": responseHTML
        })
    },

    "userFollow": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let current = utils.getSledzikFollows(utils.getAuth(req))
        let target = false;
        try {
            target = req.originalUrl.split("/follow/")[1]
                     .split("?")[0].split("/")[0].split("#")[0]
        }
        catch(error) {
            res.sendStatus(400)
            return;
        }
        let users = prv.pullJSON("users")
        if(!target
        || !users.filter(s => s.id == target)[0]) {
            utils.sendStatus(req, res, 404);
            return;
        }
        target = users.filter(s => s.id == target)[0].name
        if(target == utils.getAuth(req)
        || current.following.includes(target)) {
            res.sendStatus(400)
            return;
        }

        // preconditioni zrobione!! dodajemy
        let currentFollowList = prv.pullJSON(
            "sledzik_follows", {"id": utils.getAuth(req)}, true
        )
        if(!currentFollowList[0]) {
            prv.insert("sledzik_follows", {
                "id": utils.getAuth(req),
                "follow_list": target + ","
            })
        } else {
            prv.update("sledzik_follows", {
                "id": utils.getAuth(req)
            }, {
                "follow_list": currentFollowList + target + ","
            })
        }

        if(req.headers["referer"]) {
            res.redirect(req.headers["referer"])
        } else {
            res.redirect("/")
        }
    },


    "peoplepage": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = peoplepage_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        // ds
        let users = prv.pullJSON("users")
        let sledzik = prv.pullJSON("sledzik")
        let events = prv.pullJSON("last_events")
        let ownPosts = []
        sledzik.forEach(post => {
            let author = users.filter(s => s.id == post.sender_id)[0]
            if(!post.is_comment
            && author.name == utils.getAuth(req)) {
                ownPosts.push(post)
            }
        })

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let friends = utils.getUserFriends(self)
        let following = utils.getSledzikFollows(utils.getAuth(req))

        // typ strony
        let page = "friends"
        let headerString = "Twoi znajomi"
        let noDataString = "Nie masz żadnych znajomych."
        if(req.originalUrl.includes("followers")) {
            page = "followers"
            headerString = "Osoby, które Cię śledzą"
            noDataString = "Nikt Cię nie śledzi."
        } else if(req.originalUrl.includes("following")) {
            page = "following"
            headerString = "Osoby, które śledzisz"
            noDataString = "Nie śledzisz nikogo."
        }

        // content
        apply("friends_string", headerString)
        apply("own_id", self.id)
        apply("friends_count", friends.length)
        apply("follower_count", following.followers.length)
        apply("following_count", following.following.length)
        apply("show_active_on_" + page, "active")

        // users
        let data = []
        switch(page) {
            case "friends": {
                friends.forEach(f => {
                    data.push(users.filter(s => s.id == f)[0])
                })
                break;
            }
            case "followers": {
                following.followers.forEach(f => {
                    data.push(users.filter(s => s.id == f)[0])
                })
                break;
            }
            case "following": {
                following.following.forEach(f => {
                    data.push(users.filter(s => s.id == f)[0])
                })
                break;
            }
        }
        apply("page_counter", data.length)
        let peopleHTML = ""
        data.forEach(p => {
            peopleHTML += "<td>" + templates.friendAvatar(p) + "</td>"
        })
        if(data.length == 0) {
            peopleHTML = `<div style="height: 150px;text-align: center;padding-top: 100px;">
                <i>${noDataString}</i>
            </div>`
        }
        code = code.replace(`<!--openk_friends_list-->`, peopleHTML)

        // ostatnie gwiazdki
        let lastStars = []
        ownPosts.forEach(p => {
            let np = events.filter(s => s.type == "sledzik_star_" + p.id)
            np.forEach(p2 => {
                lastStars.push(p2)
            })
        })
        if(lastStars[0]) {
            let star = lastStars[0]
            let person = users.filter(s => s.name == star.name)[0]
            let post = sledzik.filter(s => s.id == star.type.split("star_")[1])[0]
            code = code.replace(
                `<!--openk_last_star-->`,
                templates.lastStarEntry(star, person, post)
            )
        } else {
            code = code.replace(
                `openk_hide_if_unavail="last_stars"`,
                `style="display: none"`
            )
            code = code.replace(`openkevents`, ``)
        }

        res.send(code)
    }
}