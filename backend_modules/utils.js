const crypto = require("crypto")
let SESSIONS = {}
let TOKENS = false
try {
    TOKENS = require("../config.json").tokens;
}
catch(error) {}

function l_pullSessions() {
    const s = require("./prvdb").pullJSON("session_remembers")
    s.forEach(session => {
        SESSIONS[session.session] = session.name
    })
}
l_pullSessions()

module.exports = {
    "isTopAuth": function(req) {
        if(!req.headers.cookie
        || !req.headers.cookie.includes("auth=")) return false;
        let token = req.headers.cookie.split("auth=")[1].split(";")[0]
        if(!TOKENS || TOKENS.includes(token) || TOKENS[0] == "*") {
            return true;
        }
        return false;
    },

    "getTopAuth": function(req) {
        if(!req.headers.cookie
        || !req.headers.cookie.includes("auth=")) return false;
        return req.headers.cookie.split("auth=")[1].split(";")[0]
    },

    "getAuth": function(req) {
        if(!req.headers.cookie
        || !req.headers.cookie.includes("openk_session=")) return false;
        if(!this.isTopAuth(req)) return false;
        let sessionCookie = req.headers.cookie
                            .split("openk_session=")[1].split(";")[0]
        if(SESSIONS[sessionCookie]) {
            return SESSIONS[sessionCookie]
        }
        return false;
    },

    "hash": function(pwd) {
        return crypto.createHash("sha224").update(pwd).digest("hex")
    },

    "genSession": function() {
        let a = ""
        let chars = "qwertyuiopasdfghjklzxcvbnm1234567890".split("")
        while(a.length !== 30) {
            a += chars[Math.floor(Math.random() * chars.length)]
        }
        return a;
    },

    "pushSession": function(name, session) {
        SESSIONS[session] = name;
        return true;
    },

    "xss": function(input) {
        return input.split("<").join("&lt;")
                    .split(">").join("&gt;")
    },

    "s": function(input) {
        return this.xss(decodeURIComponent(input));
    },

    "getRelativeTime": function(time) {
        let day_string = ""
        let d = new Date()
        let date_hour = ""
        let sourceDate = new Date(parseInt(time))
        let h = sourceDate.getHours();
        let m = sourceDate.getMinutes();
        date_hour += h < 10 ? "0" + h : h
        date_hour += ":" + (m < 10 ? "0" + m : m)
        if(sourceDate.getDate() == d.getDate()) {
            day_string = "dzisiaj"
        } else if(sourceDate.getDate() == d.getDate() - 1) {
            day_string = "wczoraj"
        } else {
            let day = sourceDate.getDate()
            let month = sourceDate.getMonth() + 1
            let year = sourceDate.getFullYear()
            day_string += day < 10 ? "0" + day : day;
            day_string += "." + (month < 10 ? "0" + month : month)
            day_string += "." + year;
        }
        return day_string + " " + date_hour
    },

    "getFriendCount": function(user) {
        let ids = user.friend_ids.split(",")
        ids.shift()
        if(ids[ids.length - 1] == "") {
            ids.pop()
        }
        return ids.length;
    },

    "getUserFriends": function(user) {
        let ids = user.friend_ids.split(",")
        ids.shift()
        if(ids[ids.length - 1] == "") {
            ids.pop()
        }
        return ids;
    },

    "isLiked": function(post, id) {
        return post.like_sources.startsWith(id + ",")
            || post.like_sources.includes("," + id + ",")
    },

    "commentTimeFormatter": function(input) {
        let formattedTime = ""
        let time = new Date(parseInt(input))
        let d = time.getDate()
        let m = time.getMonth() + 1
        let y = time.getFullYear()
        let h = time.getHours()
        let mi = time.getMinutes()
        formattedTime += d < 10 ? "0" + d : d
        formattedTime += "." + (m < 10 ? "0" + m : m)
        formattedTime += "." + y + " "
        formattedTime += (h < 10 ? "0" + h : h)
        formattedTime += ":" + (mi < 10 ? "0" + mi : mi)
        return formattedTime;
    },

    "getSledzikFollows": function(user) {
        const prv = require("./prvdb")
        let follows = prv.pullJSON("sledzik_follows")
        let followers = []
        let ownFollowing = follows.filter(s => s.id == user)
        if(ownFollowing[0]) {ownFollowing = ownFollowing[0].follow_list.split(",")}
        let t2 = []
        ownFollowing.forEach(f => {
            t2.push(f.replace(`\x04`, ""))
        })
        ownFollowing = t2;
        follows.forEach(f => {
            f.follow_list = f.follow_list.split("\x04").join(",")
            let temp = f.follow_list.split(",")
            if(temp[temp.length - 1] == "") {
                temp.pop()
                f.follow_list = temp.join(",")
            }
            if(f.follow_list.startsWith(user + ",")
            || f.follow_list.includes("," + user + ",")
            || (f.follow_list.split("," + user).length == 2
            && f.follow_list.split("," + user)[1] == "")) {
                followers.push(f.id)
            }
        })
        return {
            "following": ownFollowing,
            "followers": followers
        }
    },

    "getLastEvents": function(users, user) {
        let friends = []
        let tFriends = this.getUserFriends(user)
        tFriends.forEach(t => {
            friends.push(users.filter(s => s.id == t)[0])
        })
        let lastFriendEvents = []
        let lastEvents = require("./prvdb").pullJSON("last_events")
        let hides = require("./prvdb").pullJSON("notification_hides")
        lastEvents.forEach(e => {
            let hide = hides.filter(s => (s.id == e.time && s.from == user.name))
            let friend = friends.filter(s => s.name == e.name)
            if(friend[0] && !hide[0]) {
                lastFriendEvents.push(e)
            }
        })
        return lastFriendEvents;
    },

    "fillSchools": function(code, userObject, schools, classes, isProfile) {
        let templates = require("./templates")
        if(!schools) {
            schools = require("./prvdb").pullJSON("schools")
        }
        if(!classes) {
            classes = require("./prvdb").pullJSON("classes")
        }
        let userAttendedSchools = []
        schools.forEach(s => {
            let ml = JSON.parse(JSON.stringify(s)).members.split("\x04").join(",")
            if(ml.startsWith(userObject.name + ",")
            || ml.includes("," + userObject.name + ",")) {
                userAttendedSchools.push(s)
            }
        })

        let userAttendedClasses = []
        classes.forEach(s => {
            let c = JSON.parse(JSON.stringify(s))
            let ml = c.members.split("\x04").join(",")
            ml = ml.split("as:m").join("")
                   .split("as:g").join("")
                   .split("as:t").join("")
            if(ml.startsWith(userObject.name + ",")
            || ml.includes("," + userObject.name + ",")) {
                c.school = userAttendedSchools.filter(
                    e => e.cl_list.includes(s.id)
                )[0]
                userAttendedClasses.push(c)
            }
        })

        let index = 0;
        let schoolMiniHTML = ""
        let schoolMaxHTML = ""
        userAttendedSchools.forEach(s => {
            schoolMiniHTML += templates.schoolMin(s, index)
            schoolMaxHTML += templates.schoolMin(s, index, true)
            index++
        })

        let classesHTMLs = {}
        userAttendedClasses.forEach(c => {
            if(!classesHTMLs[c.school.id]) {
                classesHTMLs[c.school.id] = `<ul class="classes user_school_classes">`
            }
            classesHTMLs[c.school.id] += templates.classMin(c, c.school)
        })

        for(let c in classesHTMLs) {
            classesHTMLs[c] += "</ul>"
            schoolMaxHTML = schoolMaxHTML.replace(
                `<!--openk_classes_${c}-->`, classesHTMLs[c]
            )
        }

        schoolMaxHTML += templates.bzwbk

        if(schoolMiniHTML.length < 4) {
            schoolMiniHTML = `
        <li class="box_no_content">
            <p>Nie jesteś zapisany do żadnej szkoły.</p>
        </li>`
        }

        code = code.replace(`<!--openk_schools_min-->`, schoolMiniHTML)
        code = code.replace(`<!--openk_schools_max-->`, schoolMaxHTML)

        return code;
    },

    "fillForums": function(code, self, users, threads, forumFollows) {
        if(!users) {users = require("./prvdb").pullJSON("users")}
        if(!threads) {threads = require("./prvdb").pullJSON("threads")}
        if(!forumFollows) {forumFollows = require("./prvdb").pullJSON("followed_forums")}
        if(typeof(self) == "string") {
            self = users.filter(s => s.name == self)[0]
        }
        let selfFollows = forumFollows.filter(s => s.name == self.name)
        if(!selfFollows[0]) {
            selfFollows = ""
        } else {selfFollows = selfFollows[0].threads}
        selfFollows = selfFollows.split("\x04").join(",")

        let unreads = ""
        let reads = ""
        let index = 1;
        let templates = require("./templates")
        selfFollows.split(",").filter(s => s !== "").forEach(thread => {
            let fullThread = JSON.parse(JSON.stringify(
                threads.filter(s => s.id == thread.split(":")[0])
            ))[0]
            let posts = fullThread.post_ids.split("\x04").join(",")
            posts = posts.split(",").filter(s => s !== "")

            if(posts[posts.length - 1] !== thread.split(":")[1]) {
                // nowa wiadomość w threadzie
                unreads += templates.sideForum.unread(fullThread, index)
            } else {
                // wszystko odczytane
                reads += templates.sideForum.read(fullThread, index)
            }
            index++
        })

        function setMin() {
            code = code.replace(
                `<!--openk_forums_min-->`,
                `<li class="box_no_content">
                    <p>Na Twoich forach nie ma żadnych nowych wiadomości.</p>
                </li>`
            )
            code = code.replace(
                `<!--openk_forums-min-->`,
                `<li class="box_no_content">
                    <p>Na Twoich forach nie ma żadnych nowych wiadomości.</p>
                </li>`
            )
        }
        if(index == 1) {
            setMin()
            code = code.replace(
                `<!--openk_forums_max-->`,
                `<li class="box_no_content">
                    <p>Nie obserwujesz żadnych tematów na forum.</p>
                </li>`
            )
            return code;
        }
        if(unreads == "") {setMin();}

        code = code.replace(
            `<!--openk_forums_min-->`, unreads
        ).replace(
            `<!--openk_forums-min-->`, unreads
        )
        code = code.replace(
            `<!--openk_forums_max-->`, unreads + reads
        )

        return code;
    },

    "deleteSession": function(session) {
        delete SESSIONS[session];
    },

    "bareCount": function(input) {
        if(!input) {input = "0";}
        return input.replace(/[^0-9]/g, "")
    },

    "sendStatus": function(req, res, status) {
        if(!this.getAuth(req)) {res.redirect("/");return;}
        if(status !== 404) {res.sendStatus(status);return;}
        let userdata = JSON.parse(JSON.stringify(
            require("./prvdb").pullJSON("users", {
                "name": this.getAuth(req)
            }, true)
        ))[0]
        let code = require("fs").readFileSync(status + ".html").toString();
        let xss = this.xss;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(xss(decodeURIComponent(content)))
        }
        apply("imie", userdata.first)
        apply("nazwisko", userdata.last)
        apply("id", userdata.id)
        apply("friends_count", this.getFriendCount(userdata))
        let follows = this.getSledzikFollows(this.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply("original_url", req.originalUrl)
        res.status(status).send(code);
    }
}