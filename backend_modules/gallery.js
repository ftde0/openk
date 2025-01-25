const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")

let view_count_cooldowns = {}
const photo_uploader_template = fs.readFileSync("./photo_upload.html").toString()
const photo_page_template = fs.readFileSync("./galeria_photo.html").toString()

module.exports = {
    // html upload zdjęć pojedynczy~!
    "gen_uploader": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        let userdata = JSON.parse(JSON.stringify(prv.pullJSON("users", {
            "name": utils.getAuth(req)
        }, true)))[0]

        code = photo_uploader_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        apply("imie", userdata.first)
        apply("id", userdata.id)

        if(req.query.ct
        && !isNaN(parseInt(req.query.ct))) {
            let c = parseInt(req.query.ct).toString()
            apply("custom_target", c)
        } else {
            apply("custom_target", "")
        }

        code = utils.fillSchools(code, userdata)
        code = utils.fillForums(code, userdata)

        res.send(code)
    },

    // POST uploader
    "site_uploader": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        if(!req.body.toString().includes(`name="photo"`)) {
            res.status(400)
            res.send(`[openk] brak zdjęcia!`)
            return;
        }
        let photo_path = this.upload_photo(req, res);
        if(!photo_path) return;
        let photo_id = photo_path.split(".")[0]

        // parse opcji
        let r = req.body.toString()
        let fields = {}
        r.split("Content-Disposition: form-data; name=\"").forEach(p => {
            if(!p.startsWith(`photo"`)) {
                p = p.split("\r").join("")
                let fName = p.split(`"`)[0]
                let fContent = p.split(`\n`)
                fContent.shift();fContent.shift()
                fContent = fContent.join("\n")
                           .split("\n-----------------------------")[0]
                fields[fName] = fContent;
            }
        })

        // upload jako awatar
        if(fields.main_photo) {
            prv.update(
                "users",
                {"name": utils.getAuth(req)},
                {"photo_path": "/user_assets/" + photo_path}
            )
        }

        // custom target (np galeria szkoły)
        let custom = ""
        if(fields.custom_target && fields.custom_target.length > 2) {
            custom = fields.custom_target
        }
        
        // album handling
        let targetAlbum = ""
        let newAlbum = Date.now()
        if(fields.new_album && fields.new_album.length >= 1) {
            let albumObject = {
                "id": newAlbum,
                "creator": utils.getAuth(req),
                "title": utils.s(fields.new_album),
                "thumb": "/user_assets/" + photo_path
            }
            prv.insert("albums", albumObject)
            targetAlbum = albumObject
        }
        if(fields.album_choice && fields.album_choice.length > 1) {
            let album = prv.pullJSON(
                "albums", {"id": fields.album_choice}
            )
            if(album.creator == utils.getAuth(req)) {
                targetAlbum = album
            }
        }

        // push zdjęcia na serwer
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "photo_upload",
            "time": Date.now()
        }, true)
        prv.insert("photos", {
            "id": photo_id,
            "custom_target": custom,
            "path": "/user_assets/" + photo_path,
            "sender": utils.getAuth(req),
            "time": photo_id,
            "description": utils.s(fields.photo_description)
                                .split("\n").join("_line_break_"),
            "album_id": targetAlbum.id ? targetAlbum.id : "",
            "show_latest": (fields.dont_show && fields.dont_show == "on")
                            ? "" : "1",
            "view_count": "0"
        }, true)

        res.redirect(`/photo/${photo_id}`)
    },

    // internal uploadowanie zdjęć na serwer
    "upload_photo": function(req, res) {
        let photoStart = req.body.toString().split(`name="photo"`)[1]
                        .split(`Content-Type: `)[1].split("\n")[0]
        if(!photoStart.includes("image/jpeg")
        && !photoStart.includes("image/jpg")
        && !photoStart.includes("image/png")
        && !photoStart.includes("image/pjpeg")
        && !photoStart.includes("image/gif")) {
            res.status(400)
            res.send(`[openk] niepoprawny format pliku!`)
            return;
        }
        let fileType = "jpg"
        if(photoStart.includes("image/png")) {
            fileType = "png"
        }
        if(photoStart.includes("image/gif")) {
            fileType = "gif"
        }
        photoStart = req.body.toString().indexOf(photoStart) + photoStart.length
        let file = req.body.slice(photoStart)
        while(file[0] == 10 || file[0] == 13) {
            file = file.slice(1)
        }
        let expectedHeaders = {
            "jpg": [255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0],
            "png": [137, 80, 78, 71]
        }
        let h = expectedHeaders[fileType]
        let fileSubset = JSON.stringify(
            JSON.parse(JSON.stringify(file.slice(0, h.length))).data
        )
        if(JSON.stringify(h) == fileSubset) {
            console.log("HEADER MATCH")
        } else {
            res.status(400)
            res.send(`[openk] niepoprawny format pliku!`)
            return;
        }
        let filename = `${Date.now()}.${fileType}`
        fs.writeFileSync(`./user_assets/${filename}`, file)
        return filename;
    },

    // strona zdjęcia
    "photo_view": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        // dane o zdjęciu, twórcy i komentarzach
        let photoId = ""
        try {
            photoId = req.originalUrl.split("photo/")[1]
                         .split("?")[0].split("&")[0]
                         .split("/")[0].split("#")[0]
        }
        catch(error) {
            photoId = req.originalUrl.split("gallery/")[1]
                         .split("?")[0].split("&")[0]
                         .split("/")[0].split("#")[0]
        }
        let photo = prv.pullJSON("photos", {"id": photoId}, true)
        if(photo.length == 0) {
            res.status(404)
            res.send("[openk] nie ma takiego zdjęcia!")
            return;
        }
        photo = photo[0]
        let photoDate = new Date(parseInt(photo.time))
        let day = photoDate.getDate()
        day = day < 10 ? "0" + day : day;
        let monthsTable = [
            "stycznia", "lutego", "marca",
            "kwietnia", "maja", "czerwca",
            "lipca", "sierpnia", "września",
            "października", "listopada", "grudnia"
        ]
        let month = monthsTable[photoDate.getMonth()]
        let hour = photoDate.getHours()
        hour = hour < 10 ? "0" + hour : hour
        let min = photoDate.getMinutes()
        min = min < 10 ? "0" + min : min
        let year = photoDate.getFullYear()
        let sender = prv.pullJSON("users", {"name": photo.sender}, true)[0]
        let comments = prv.pullJSON(
            "photo_comments", {"ref_photo": photo.id}, true
        )
        let you = prv.pullJSON("users", {"name": utils.getAuth(req)}, true)[0]

        // licznik wyświetleń
        if(!view_count_cooldowns[photo.id]) {
            view_count_cooldowns[photo.id] = []
        }
        if(!view_count_cooldowns[photo.id].includes(req.ip)) {
            view_count_cooldowns[photo.id].push(req.ip)
            prv.update("photos", {
                "id": photo.id
            }, {
                "view_count": (parseInt(photo.view_count) + 1).toString()
            })
            photo.view_count = parseInt(photo.view_count) + 1

            setTimeout(() => {
                let v = view_count_cooldowns[photo.id]
                view_count_cooldowns[photo.id] = v.filter(s => s !== req.ip)
            }, 1000 * 60 * 5)
        }

        // apply htmla
        let code = photo_page_template
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        
        apply("comment_count", comments.length)
        apply("photo_path", photo.path)
        apply("photo_id", photo.id)
        apply("your_pfp", you.photo_path)
        apply("sender_name", sender.first + " " + sender.last)
        apply("sender_id", sender.id)
        apply("view_count", photo.view_count)
        apply("day", day)
        apply("month", month)
        apply("year", year)
        apply("hour", hour + ":" + min)
        apply("prev", "#")
        apply("imie", you.first)
        apply("id", you.id)
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply("friends_count", utils.getFriendCount(you))

        // komentarze
        let commentsHTML = ""
        let commentIndex = 0;
        comments.forEach(c => {
            commentIndex++
            let author = prv.pullJSON("users", {"name": c.creator}, true)[0]
            commentsHTML += templates.photoComment(c, author, commentIndex)
        })
        code = code.replace(
            `<!--openk_photo_comments-->`,
            commentsHTML
        )

        // pokaż formularz komentarzy dla nonjs
        if(req.originalUrl.includes("add_comment")) {
            code = code.replace(`id="comment_txt"`, `id="comment_txt" class="hide"`)
            code = code.replace(`"add_comment" class="hide"`, `"add_comment"`)
        }

        code = utils.fillSchools(code, you)
        code = utils.fillForums(code, you)

        res.send(code)
    },

    "ajax_last_photos": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        let photos = prv.pullJSON("photos").slice(0, 5)
        let users = prv.pullJSON("users");
        res.send(templates.lastPhotos(photos, users))
    },

    "magick_thumb": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/login");return;}
        if(!req.query.id) {res.sendStatus(400);return;}
        const child_process = require("child_process")
        let safeId = req.query.id.replace(/[^0-9]/g, "")
        let format = "png"
        if(fs.existsSync(`./user_assets/${safeId}.jpg`)) {
            format = "jpg"
        } else if(!fs.existsSync(`./user_assets/${safeId}.png`)) {
            utils.sendStatus(req, res, 404);
            return;
        }

        if(fs.existsSync(`./user_assets/${safeId}.thumb.${format}`)) {
            res.redirect(`/user_assets/${safeId}.thumb.${format}`)
            return;
        }

        let command = [
            "magick",
            `"${__dirname}/../user_assets/${safeId}.${format}"[0]`,
            "-scale 100",
            `"${__dirname}/../user_assets/${safeId}.thumb.${format}"`
        ].join(" ")
        child_process.exec(command, (e, so, se) => {
            if(!e) {
                res.redirect(`/user_assets/${safeId}.thumb.${format}`)
            } else {
                utils.sendStatus(req, res, 404)
            }            
        })
    },

    "photo_comment_add": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        if(!req.body || !req.body.toString()
        || !req.body.toString().includes("content=")
        || !req.body.toString().includes("back_link=")) {
            res.sendStatus(400)
            return;
        }

        let id = req.originalUrl.split("photo/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        
        let photoMatch = prv.pullJSON("photos", {"id": id}, true)
        if(!photoMatch[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }

        let content = decodeURIComponent(
            req.body.toString().split("content=")[1].split("&")[0]
        ).split("\r").join("").split("\n").join("_lbr_")
        content = utils.xss(content)

        prv.insert("photo_comments", {
            "id": Date.now(),
            "creator": utils.getAuth(req),
            "content": content,
            "ref_photo": id
        }, true)
        prv.insert("last_events", {
            "name": utils.getAuth(req),
            "type": "photo_comment",
            "time": Date.now()
        }, true)

        let backLink = decodeURIComponent(
            req.body.toString().split("back_link=")[1].split("&")[0]
        )

        res.redirect(backLink)
    }
}