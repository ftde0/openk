const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const fs = require("fs")

const dane_template = fs.readFileSync("./profile_edit.html").toString()

module.exports = {
    "gen_userdata_edit": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let users = JSON.parse(JSON.stringify(prv.pullJSON("users")))

        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let code = dane_template;
        apply("login_name", utils.getAuth(req))
        apply("imie", self.first)
        apply("nazwisko", self.last)
        apply("id", self.id)
        apply("city", self.city)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        code = code.replace(
            `<option value="${self.gender}">`,
            `<option value="${self.gender}" selected>`
        )
        code = code.replace(
            `<option class="artificial_option" value="${self.fictional}">`,
            `<option class="artificial_option" value="${self.fictional}" selected>`,
        )
        code = code.replace(
            `<option value="${self.dob.split("-")[0]}">`,
            `<option value="${self.dob.split("-")[0]}" selected>`,
        )
        code = code.replace(
            `<option class="bm" value="${self.dob.split("-")[1]}">`,
            `<option class="bm value="${self.dob.split("-")[1]}" selected>`,
        )
        code = code.replace(
            `<option class="bd" value="${self.dob.split("-")[2]}">`,
            `<option class="bd value="${self.dob.split("-")[2]}" selected>`,
        )

        let additionals = prv.pullJSON(
            "additional_fields", {"name": utils.getAuth(req)}, true
        )
        let aboutme = ""
        let currently = ""
        if(additionals[0]) {
            aboutme = utils.xss(additionals[0].aboutme).split("_lbr_").join("\n")
            currently = utils.xss(additionals[0].currently).split("_lbr_").join("\n")
        }
        code = code.replace(`openk_aboutme`, aboutme)
        code = code.replace(`openk_currently`, currently)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self, users)

        res.send(code);
    },

    "commit_profile_userdata_changes": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let fields = {}
        if(req.body.toString()) {
            req.body.toString().split("&").forEach(p => {
                let name = p.split("=")[0]
                let value = decodeURIComponent(p).split("=")
                value.shift()
                value = value.join("=")
                        .split("+").join(" ")
                        .split("\r").join("")
                        .split("\n").join("_lbr_")
                if(value && value.length >= 1) {
                    fields[name] = value;
                }
            })
        }

        // sprawdzanie czy fieldy są ok
        if(!fields.first_name
        || !fields.last_name
        || !fields.birth_date_day
        || !fields.birth_date_month
        || !fields.birth_date_year
        || !fields.gender
        || !fields.artificial) {
            res.status(400);
            res.send("[openk] brak wymaganych danych!")
            return;
        }
        if(fields.first_name.length > 64
        || fields.last_name.length > 64
        || fields.first_name.length < 1
        || fields.last_name.length < 1
        || isNaN(parseInt(fields.birth_date_day))
        || parseInt(fields.birth_date_day) > 31
        || parseInt(fields.birth_date_day) < 1
        || isNaN(parseInt(fields.birth_date_month))
        || parseInt(fields.birth_date_month) > 12
        || parseInt(fields.birth_date_month) < 1
        || isNaN(parseInt(fields.birth_date_year))
        || parseInt(fields.birth_date_year) > 2011
        || parseInt(fields.birth_date_year) < 1900
        || (fields.gender !== "M" && fields.gender !== "F")
        || (fields.artificial !== "0" && fields.artificial !== "1")
        || (fields.city && fields.city.length > 64)
        || (fields.aboutme && fields.aboutme.length > 1000)
        || (fields.currently && fields.currently.length > 1000)) {
            res.status(400)
            res.send("[openk] niepoprawnie wypełnione pola!")
            return;
        }
        fields.birth_date_day = utils.bareCount(fields.birth_date_day)
        fields.birth_date_month = utils.bareCount(fields.birth_date_month)
        fields.birth_date_year = utils.bareCount(fields.birth_date_year)

        // update pól o sobie i aktualne zajęcie
        let additionals = prv.pullJSON(
            "additional_fields", {"name": utils.getAuth(req)}, true
        )
        if(additionals[0]
        && (fields.aboutme
        || fields.currently)) {
            if(!fields.aboutme) {fields.aboutme = ""}
            if(!fields.currently) {fields.currently = ""}
            prv.update(
                "additional_fields", {"name": utils.getAuth(req)},
                {"aboutme": fields.aboutme, "currently": fields.currently}
            )
        } else if(!additionals[0]
        && (fields.aboutme
        || fields.currently)) {
            if(!fields.aboutme) {fields.aboutme = ""}
            if(!fields.currently) {fields.currently = ""}
            prv.insert("additional_fields", {
                "name": utils.getAuth(req),
                "aboutme": fields.aboutme,
                "currently": fields.currently
            })
        }

        // preparujemy nazwy reszty wartości pod wrzucenie do ds
        let sFields = {}
        let nameSwaps = {
            "first_name": "first",
            "last_name": "last",
            "artificial": "fictional"
        }
        for(let name in fields) {
            let value = fields[name]
            if(nameSwaps[name]) {name = nameSwaps[name]}
            if(name !== "login" && name !== "aboutme" && name !== "currently"
            && !name.startsWith("birth_")) {
                sFields[name] = value;
            }
        }
        sFields.dob = fields.birth_date_year
                    + "-" + fields.birth_date_month
                    + "-" + fields.birth_date_day;
        
        // update danych użytkownika
        prv.update("users", {"name": utils.getAuth(req)}, sFields)
        res.redirect("/profile_edit/dane?c=" + Math.random())
    }
}