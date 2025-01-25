const express = require("express");
const utils = require("./backend_modules/utils")
const prvclient = require("./backend_modules/prvdb")
const siteModules = require("./backend_modules/site_modules")

const sledzik = require("./backend_modules/sledzik")
const events = require("./backend_modules/events")
const gallery = require("./backend_modules/gallery")
const profiles = require("./backend_modules/profiles")
const notifs = require("./backend_modules/notifications_mail")
const schools = require("./backend_modules/schools")
const search = require("./backend_modules/search")
const editors = require("./backend_modules/profile_editors")

const https = require("https")
const fs = require("fs")
const staticPages = {
    "login": fs.readFileSync("./login.html").toString(),
    "register": fs.readFileSync("./register.html").toString()
}
const app = express();
const config = require("./config.json")
const port = config.port
app.use(express.raw({
    "type": () => true,
    "limit": "2mb"
}))
app.listen(port, () => {
    console.log(`
==========

  openk

==========
    `);
});
if(config.sslEnable) {
    const server = https.createServer({
        cert: fs.readFileSync(config.sslCert),
        key: fs.readFileSync(config.sslKey)
    }, app).listen(config.sslPort)
}
if(!fs.existsSync("./user_assets/")) {
    fs.mkdirSync(__dirname + "/user_assets")
}
app.get("/backend_modules/*", (req, res) => {
    res.sendStatus(403)
})
app.get("/back.js", (req, res) => {res.sendStatus(403)})
app.use(express.static("./"))

app.get("/", (req, res) => {
    if(!utils.getAuth(req)) {
        res.redirect("/login")
        return;
    }

    require("./backend_modules/mainpage").gen(req, res);
})
app.get("/main", (req, res) => {res.redirect("/")})
app.get("/login", (req, res) => {
    if(!utils.isTopAuth(req)) {
        res.redirect("/auth.html")
        return;
    }
    function n(text, wrong) {
        return `<div class="notification${wrong ?
        " notification_wrong" : " notification_normal"}">
            <span>${text}</span>
        </div>`
    }
    let code = staticPages.login;

    let states = {
        "1": n("Niepoprawny login lub hasło.", true),
        "2": n("Konto zostało utworzone. Możesz się zalogować.")
    }
    
    if(req.query.s && states[req.query.s]) {
        code = code.replace(`<!--openk_login_notif-->`, states[req.query.s])
    }

    res.send(code);
})
app.get("/register", (req, res) => {
    if(!utils.isTopAuth(req)) {
        res.redirect("/auth.html")
        return;
    }
    function n(text, wrong) {
        return `<div class="notification${wrong ? " notification_wrong" : ""}">
            <span>${text}</span>
        </div>`
    }
    let code = staticPages.register;

    let states = {
        "1": n("Nie wszystkie wymagane pola zostały wypełnione.", true),
        "2": n("Jedno lub więcej wymaganych pól zostały wypełnione niepoprawnie.", true),
        "3": n("Użytkownik o takim loginie już istnieje.", true)
    }
    
    if(req.query.s && states[req.query.s]) {
        code = code.replace(`<!--openk_reg_notif-->`, states[req.query.s])
    }

    res.send(code);
})
app.get("/blog/portal/ajax_normal/*", (req, res) => {res.send("")})
app.get("/sledzik/shout/count/*", (req, res) => {res.send([])})

// auth
app.post("/login", (req, res) => {
    let data = req.body.toString();
    if(!data.includes("login=")
    || !data.includes("password=")) {
        res.redirect("/login")
        return;
    }
    let remember = data.includes("remember=1")
    let login = utils.xss(data.split("login=")[1].split("&")[0])
    let pwd = utils.hash(data.split("password=")[1].split("&")[0])
    
    let match = prvclient.pullJSON("users")
    match = match.filter(s => s.name == login && s.pwd == pwd)
    if(match[0]) {
        let s = utils.genSession()
        utils.pushSession(match[0].name, s)
        let cookieParams = [
            `openk_session=${s}; `,
            `Path=/; `,
            `Expires=Fri, 31 Dec 2066 23:59:59 GMT`
        ]
        res.set("set-cookie", cookieParams.join(""))
        res.set("location", "/")
        res.sendStatus(301)

        if(remember) {
            prvclient.insert("session_remembers", {
                "id": Date.now(),
                "session": s,
                "name": match[0].name
            })
        }
    } else {
        res.redirect("/login?s=1")
    }
})

app.post("/register", (req, res) => {
    if(!utils.isTopAuth(req)) {res.redirect("/");return;}
    let data = req.body.toString();
    let failed_fields = []
    let fields = {
        "login": "",
        "first_name": "",
        "last_name": "",
        "password_nac": "",
        "gender": "",
        "birth_date_day": "",
        "birth_date_month": "",
        "birth_date_year": "",
        "artificial": ""
    }
    for(let f in fields) {
        if(!data.includes(f + "=")
        || data.includes(f + "=&")) {
            failed_fields.push(f)
        } else {
            fields[f] = data.split(f + "=")[1].split("&")[0]
        }
    }
    if(failed_fields.length >= 1) {
        /*res.status(400)
        res.send("[openk] niewypełnione pola: " + failed_fields.join(","))*/
        res.redirect("/register?s=1")
        return;
    }

    // niepoprawnie wypełnione pola
    if(fields.login.length > 64
    || fields.login.includes(",")
    || fields.login.includes(":")
    || fields.first_name.length > 20
    || fields.last_name.length > 40
    || fields.password_nac.length > 256
    || (fields.gender !== "M" && fields.gender !== "F")
    || isNaN(parseInt(fields.birth_date_day))
    || parseInt(fields.birth_date_day) > 31
    || parseInt(fields.birth_date_day) < 1
    || isNaN(parseInt(fields.birth_date_month))
    || parseInt(fields.birth_date_month) > 12
    || parseInt(fields.birth_date_month) < 1
    || isNaN(parseInt(fields.birth_date_year))
    || parseInt(fields.birth_date_year) > 2025
    || (fields.artificial !== "0" && fields.artificial !== "1")) {
        res.redirect("/register?s=2")
        return;
    }

    let id = prvclient.getCount("users")
    if(!id || id == undefined || id == "") {id = 1;}
    if(prvclient.pullJSON("users", {"name": utils.xss(fields.login)}, true).length >= 1) {
        res.redirect("/register?s=3")
        return;
    }

    fields.last_name = fields.last_name.split("+").join(" ")
    fields.first_name = fields.first_name.split("+").join(" ")
    fields.birth_date_day = utils.bareCount(fields.birth_date_day)
    fields.birth_date_month = utils.bareCount(fields.birth_date_month)
    fields.birth_date_year = utils.bareCount(fields.birth_date_year)

    prvclient.insert("users", {
        "name": utils.xss(fields.login),
        "id": id,
        "first": utils.xss(fields.first_name),
        "last": utils.xss(fields.last_name),
        "pwd": utils.hash(fields.password_nac),
        "photo_path": "/img/brakzdjecia.gif",
        "dob": `${fields.birth_date_year}-${fields.birth_date_month}-${fields.birth_date_day}`,
        "fictional": fields.artificial,
        "gender": fields.gender,
        "city": "",
        "friend_ids": id,
        "token": utils.getTopAuth(req)
    })

    res.redirect("/login?s=2")
})

app.get("/logout", (req, res) => {
    if(!utils.getAuth(req)) {res.send("/");return;}
    let session = req.headers.cookie.split("openk_session=")[1].split(";")[0]
    utils.deleteSession(session)
    let savedSessions = JSON.parse(JSON.stringify(
        prvclient.pullJSON("session_remembers")
    ))
    let s = savedSessions.filter(s => s.session == session)
    if(s[0]) {
        prvclient.delete("session_remembers", {"id": s[0].id})
    }
    res.redirect("/")
})


// moduły
app.get("/might_know/listJSON*", (req, res) => {
    siteModules.might_know(req, res)
})
app.get("/okienka/api/get_user_widgets", (req, res) => {
    siteModules.calendar(req, res)
})

// śledzik
app.post("/sledzik/shout/add*", (req, res) => {
    sledzik.addPost(req, res)
})
app.post("/sledzik/shout/*/comment/add*", (req, res) => {
    sledzik.commentPost(req, res)
})
app.post("/sledzik/shout/*/star/add*", (req, res) => {
    sledzik.starPost(req, res)
})
app.get("/sledzik", (req, res) => {
    sledzik.mainPage(req, res)
})
app.get("/sledzik/profile/*", (req, res) => {
    profiles.gen_profile(req, res)
})
app.get("/sledzik/shout/list/*", (req, res) => {
    sledzik.ajaxPosts(req, res)
})
app.get("/sledzik/last_star", (req, res) => {
    sledzik.lastStar(req, res)
})
app.get("/sledzik/follow/*", (req, res) => {
    sledzik.userFollow(req, res)
})
let sledzikPeopleList = [
    "/sledzik/friends",
    "/sledzik/followers",
    "/sledzik/following"
]
sledzikPeopleList.forEach(s => {
    app.get(s, (req, res) => {
        sledzik.peoplepage(req, res)
    })
})
app.get("/sledzik/follower", (req, res) => {
    res.redirect("/sledzik/following")
})
app.get("/sledzik/followee", (req, res) => {
    res.redirect("/sledzik/followers")
})
app.get("/sledzik/mail", (req, res) => {
    res.redirect("/poczta")
})

// galeria
app.get("/profile/gallery/add", (req, res) => {
    gallery.gen_uploader(req, res)
})
app.post("/profile/gallery/add", (req, res) => {
    gallery.site_uploader(req, res)
})
// GET /photo/* - strona ze zdjęciem
// POST /photo/* - komentowanie zdjęć
app.get("/photo/*", (req, res) => {
    gallery.photo_view(req, res)
})
app.post("/photo/*", (req, res) => {
    gallery.photo_comment_add(req, res)
})
app.get("/ajax_boxes/last_photos", (req, res) => {
    gallery.ajax_last_photos(req, res)
})
app.get("/get_thumb", (req, res) => {
    gallery.magick_thumb(req, res)
})

// profile
app.get("/profile/gallery", (req, res) => {
    if(!utils.getAuth(req)) {res.redirect("/");return;}
    let u = prvclient.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]
    res.redirect("/profile/" + u.id + "/gallery")
})
app.get("/profile/*/gallery", (req, res) => {
    profiles.profilepage_galleries(req, res)
})
app.get("/profile/*/friends", (req, res) => {
    profiles.profilepage_friends(req, res)
})
app.post("/profile/*/comments/add", (req, res) => {
    profiles.add_comment(req, res)
})
app.get("/profile", (req, res) => {
    if(!utils.getAuth(req)) {res.redirect("/");return;}
    let self = prvclient.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]
    res.redirect("/profile/" + self.id)
})
app.get("/profile/*", (req, res) => {
    profiles.gen_profile(req, res)
})
app.get("/friends/*", (req, res) => {
    let id = req.originalUrl.split("friends/")[1].split("/")[0].split("?")[0]
    res.redirect("/profile/" + id + "/friends")
})
app.post("/invite/*", (req, res) => {
    profiles.sendFriend(req, res)
})
app.get("/invite/accept/*", (req, res) => {
    profiles.acceptFriend(req, res)
})
app.get("/friends", (req, res) => {
    if(!utils.getAuth(req)) {res.redirect("/");return;}
    let self = prvclient.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]
    res.redirect("/profile/" + self.id + "/friends")
})
app.get("/friends_invite_accept", (req, res) => {
    if(!req.query.id) {res.sendStatus(400);return;}
    res.redirect("/invite/accept/" + req.query.id)
})
app.get("/friends_invite_remove", (req, res) => {
    profiles.removeFriendRequest(req, res)
})

// powiadomienia/maile
app.get("/events/get/*", (req, res) => {
    notifs.get_last_events(req, res)
})
app.get("/new_messages_json/top*", (req, res) => {
    notifs.get_new_mail(req, res)
})
app.get("/poczta/inbox/get/*", (req, res) => {
    notifs.get_json_messages(req, res)
})
app.get("/poczta/*/js", (req, res) => {
    notifs.get_json_message(req, res)
})
app.post("/events/remove", (req, res) => {
    notifs.hide_event(req, res)
})
app.post("/events/remove/js", (req, res) => {
    notifs.hide_event(req, res)
})
const sameHandleInbox = [
    "/poczta",
    "/poczta/outbox",
    "/poczta/saved",
    "/poczta/trash",
    "/poczta/inbox"
]
sameHandleInbox.forEach(e => {
    app.get(e, (req, res) => {
        notifs.gen_inbox_page(req, res)
    })
})
app.get("/static_post_action", (req, res) => {
    notifs.static_actions(req, res)
})
app.get("/poczta/msg/*", (req, res) => {
    notifs.static_inbox_read(req, res)
})
app.post("/poczta/move/js", (req, res) => {
    notifs.js_actions(req, res)
})
app.post("/poczta/send", (req, res) => {
    notifs.inbox_send(req, res)
})
app.get("/poczta/choose", (req, res) => {
    res.redirect("/poczta/compose")
})
app.get("/poczta/compose", (req, res) => {
    notifs.inbox_picker(req, res)
})
app.get("/poczta/compose/*", (req, res) => {
    notifs.inbox_compose_page(req, res)
})

// szkoły
app.get("/country", (req, res) => {
    schools.gen_country_picker(req, res)
})
app.get("/country/*", (req, res) => {
    schools.gen_w_picker(req, res)
})
app.post("/forum/add_reply", (req, res) => {
    schools.forum_add_post(req, res)
})
app.get("/forum/*", (req, res) => {
    schools.gen_forum_thread(req, res)
})
app.get("/school/*/photos", (req, res) => {
    schools.gen_gallery_page(req, res)
})
app.get("/school/*/register_teacher", (req, res) => {
    schools.class_register(req, res, "teacher")
})
app.get("/school/*/register_member", (req, res) => {
    schools.class_register(req, res, "member")
})
app.get("/school/*/register_guest", (req, res) => {
    schools.class_register(req, res, "guest")
})
app.get("/school/*/add_class", (req, res) => {
    schools.gen_class_create_page(req, res)
})
app.post("/school/class_add", (req, res) => {
    schools.create_class(req, res)
})
app.post("/school/forum_thread_add", (req, res) => {
    schools.create_forum(req, res)
})
app.post("/school/add", (req, res) => {
    schools.create_school(req, res)
})
app.get("/school/*/register", (req, res) => {
    schools.register_to_school(req, res)
})
app.get("/school/*/users", (req, res) => {
    schools.gen_users_page(req, res)
})
app.get("/school/*/forum", (req, res) => {
    schools.gen_forums_page(req, res)
})
app.get("/school/*", (req, res) => {
    schools.gen_school_page(req, res)
})
app.get("/add_school", (req, res) => {
    schools.gen_school_adder(req, res)
})

// wyszukiwarka
app.get("/szukaj/profile", (req, res) => {
    if(!req.query.q) {res.redirect("/user_search");return;}
    res.redirect("/user_search?name=" + req.query.q)
})
app.get("/user_search", (req, res) => {
    search.gen_user_search(req, res)
})
app.get("/search", (req, res) => {
    res.redirect("/user_search")
})

// edycja profilu
app.get("/profile_edit", (req, res) => {
    res.redirect("/profile_edit/dane")
})
app.get("/profile/edit", (req, res) => {
    res.redirect("/profile_edit/dane")
})
app.get("/profile_edit/dane", (req, res) => {
    editors.gen_userdata_edit(req, res)
})
app.post("/profile_edit/dane", (req, res) => {
    editors.commit_profile_userdata_changes(req, res)
}) 

// strony listujące z górnego menu (szkoły, zaproszenia etc)
app.get("/show_invites", (req, res) => {
    profiles.genFriendRequests(req, res)
})
app.get("/schools", (req, res) => {
    schools.get_your_schools(req, res)
})
app.get("/forum", (req, res) => {
    schools.get_your_forums(req, res)
})
app.get("/my_forums", (req, res) => {
    schools.get_your_forums(req, res)
})

// events
app.get("/events", (req, res) => {
    events.gen(req, res)
})

app.get("/quickmenu/redirect", (req, res) => {
    if(!req.query.target) {res.redirect("/");return;}
    res.redirect(req.query.target)
})
app.use((req, res, next) => {
    utils.sendStatus(req, res, 404)
})
let exceptions = [
    "uncaughtException", "unhandledRejection"
]
exceptions.forEach(e => {
    process.on(e, (msg) => {
        console.log(msg)
    })
})