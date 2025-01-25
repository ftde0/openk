const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")

const user_search_template = fs.readFileSync("./user_search.html").toString()

module.exports = {
    "gen_user_search": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = JSON.parse(JSON.stringify(prv.pullJSON("users")))
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        let code = user_search_template;
        apply("own_name", self.first)
        apply("own_id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        if(!req.query.name && !req.query.city) {
            apply("s_username", "")
            apply("s_city", "")
            code = code.replace(
                `<!--openk_results-->`,
                `<span>Wypełnij co najmniej jedno z pogrubionych pól.</span>`
            )
            res.send(code);
            return;
        }

        // wyszukiwarka
        let userMatches = users;

        if(req.query.name) {
            req.query.name = decodeURIComponent(req.query.name).toLowerCase()
            userMatches = userMatches.filter(s => 
                (s.first.toLowerCase() + " " + s.last.toLowerCase())
                .includes(req.query.name)
            )
            apply("s_username", req.query.name)
        } else {apply("s_username", "")}

        if(req.query.gender
        && (req.query.gender == "F") || (req.query.gender == "M")) {
            userMatches = userMatches.filter(s => (s.gender) == req.query.gender)
            code = code.replace(
                `<option value="${req.query.gender}">`,
                `<option value="${req.query.gender}" selected>`
            )
        }

        if(req.query.city) {
            req.query.city = decodeURIComponent(req.query.city).toLowerCase()
            userMatches = userMatches.filter(
                s => s.city.toLowerCase().includes(req.query.city)
            )
            apply("s_city", req.query.city)
        } else {apply("s_city", "")}

        if(req.query.age1 && !isNaN(parseInt(req.query.age1))) {
            let ageStart = parseInt(req.query.age1)
            userMatches = userMatches.filter(s => {
                let userAge = Date.now() - new Date(s.dob).getTime()
                userAge = userAge / (1000 * 60 * 60 * 24 * 365)
                userAge = Math.floor(userAge)

                return userAge >= ageStart;
            })

            code = code.replace(
                `<option value="${req.query.age1}">`,
                `<option value="${req.query.age1}" selected>`
            )
        }

        if(req.query.age2 && !isNaN(parseInt(req.query.age2))) {
            let ageEnd = parseInt(req.query.age2)
            userMatches = userMatches.filter(s => {
                let userAge = Date.now() - new Date(s.dob).getTime()
                userAge = userAge / (1000 * 60 * 60 * 24 * 365)
                userAge = Math.floor(userAge)

                return userAge <= ageEnd;
            })

            code = code.replace(
                `<option value="${req.query.age1}">`,
                `<option value="${req.query.age1}" selected>`
            )
        }
        
        // dodajemy wszystkich
        let resultsHTML = ""
        userMatches.forEach(user => {
            resultsHTML += "<td>" + templates.friendAvatar(user) + "</td>"
        })
        if(userMatches.length == 0) {
            resultsHTML = `
            <span>Żaden użytkownik nie spełnia twoich kryteriów.</span>
            `
        }
        code = code.replace(`<!--openk_results-->`, resultsHTML)

        res.send(code);
    }
}