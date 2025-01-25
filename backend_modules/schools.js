const fs = require("fs")
const prv = require("./prvdb")
const utils = require("./utils")
const templates = require("./templates")
const country_picker_template = fs.readFileSync("./country.html").toString()
const w_picker_template = fs.readFileSync("./country_selector.html").toString()
const school_page_template = fs.readFileSync("./school_page.html").toString()
const school_add_page_template = fs.readFileSync("./school_create.html").toString()
const school_users_page_template = fs.readFileSync("./school_users.html").toString()
const school_class_create_template = fs.readFileSync("./school_class_create.html").toString()
const school_class_template = fs.readFileSync("./school_class.html").toString()
const gallery_template = fs.readFileSync("./galeria.html").toString()
const forum_threads_template = fs.readFileSync("./school_forums.html").toString()
const forum_thread_template = fs.readFileSync("./forum_thread.html").toString()
const school_list_template = fs.readFileSync("./school_list.html").toString()
const forum_list_template = fs.readFileSync("./forum_list.html").toString()

let voivodeships = {
    "2": "Dolnośląskie",
    "4": "Kujawsko-pomorskie",
    "6": "Lubelskie",
    "8": "Lubuskie",
    "10": "Łódzkie",
    "12": "Małopolskie",
    "14": "Mazowieckie",
    "16": "Opolskie",
    "18": "Podkarpackie",
    "20": "Podlaskie",
    "22": "Pomorskie",
    "24": "Śląskie",
    "26": "Świętokrzyskie",
    "28": "Warmińsko-mazurskie",
    "30": "Wielkopolskie",
    "32": "Zachodniopomorskie",
    "34": "Nibylandia",
    "42": "Zagranica"
}

module.exports = {
    "gen_country_picker": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = country_picker_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "gen_school_adder": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = school_add_page_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "gen_w_picker": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("country/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        if(!voivodeships[id]) {
            res.redirect("/country")
            return;
        }
        let code = w_picker_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply("wojewodztwo_id", id)
        apply("wojewodztwo", voivodeships[id])

        let schools = prv.pullJSON("schools", {
            "voivodeship": id
        }, true)
        let list = JSON.parse(JSON.stringify(schools))
        if(req.query.letter) {
            let start = req.query.letter.substring(0, 1)
            let match = schools.filter(s => s.city.startsWith(start))
            list = match;
        }
        if(list.length > 0) {
            list = list.sort((a, b) => {
                a.name = a.name.toLowerCase();b.name = b.name.toLowerCase()
                if(a.name < b.name) return -1;
                if(b.name > a.name) return 1;
                return 0;
            })
            let html = ""
            list.forEach(s => {
                html += `
                <a href="/school/${s.id}">
                    <span>${utils.s(s.name)}</span>
                </a>`
            })
            code = code.replace(
                `<!--openk_schools-->`,
                html
            )
        } else {
            code = code.replace(
                `<!--openk_schools-->`,
                `<i>brak szkół odpowiadających kryteriom.</i>`
            )
        }

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "gen_school_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("school/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]

        // handler klas jak potrzebny
        if(req.originalUrl.includes(`${id}/`)
        && req.originalUrl.split(`${id}/`)[1]
              .split("?")[0].split("/")[0].length > 0) {
            let classId = req.originalUrl.split(`${id}/`)[1]
                             .split("?")[0].split("/")[0];
            this.gen_class_page(req, res, id, classId)
            return;
        }

        // albo nie
        let code = school_page_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        let users = prv.pullJSON("users")
        let schools = prv.pullJSON("schools")
        let classes = prv.pullJSON("classes")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let school = schools.filter(s => s.id == id)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]
        let members = school.members.split("\x04").join(",").split(",")
        let memberCount = 0;
        if(members[members.length - 1] == "") {
            memberCount = members.length - 1
        } else {
            memberCount = members.length
        }

        // podstawowe dane przez apply
        apply("school_id", id)
        apply("school_name", school.name)
        apply("city_name", school.city)
        apply("school_patron", school.patron)
        apply("school_building_photo", school.build_photo)
        apply("school_people_photo", school.people_photo)
        apply("school_users", memberCount)
        apply("location", school.addressline)
        apply("city", school.city)
        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        // ukrywanie zdjęć jak nie ma
        if(school.build_photo.includes("brakzdjecia")) {
            code = code.replace("openk_bh_if", "hide")
        }
        if(school.people_photo.includes("brakzdjecia")) {
            code = code.replace("openk_ph_if", "hide")
        }
        if(school.people_photo.includes("brakzdjecia")
        && school.build_photo.includes("brakzdjecia")) {
            code = code.replace(
                `last_photos_and_address openk_clc_if`,``
            )
        }

        // czy jesteśmy wpisani
        if(members.includes(utils.getAuth(req))) {
            code = code.replace(`openk_rh_if`, `hide`)
        }

        // ostatnie osoby
        members.slice(members.length - 5)
        members = members.reverse()
        let membersHTML = ""
        while(members[0] == "") {
            members.shift()
        }
        members.forEach(m => {
            let user = users.filter(s => s.name == m)[0]
            membersHTML += templates.friendAvatar(user)
        })
        code = code.replace(
            `<!--openk_school_last5-->`,
            membersHTML
        )

        // klasy
        let startYear = 1920
        let endYear = 2030
        let selection = "p"
        if(req.query.selection_type) {
            selection = req.query.selection_type
        }
        if(selection !== "p" && selection !== "d") {selection = "p"}
        if(req.query.begin_year) {
            startYear = parseInt(req.query.begin_year)
            if(isNaN(startYear)) {startYear = 1920}
        }
        if(req.query.end_year) {
            endYear = parseInt(req.query.end_year)
            if(isNaN(endYear)) {endYear = 1920}
        }
        classes = classes.filter(s => (
            school.cl_list.includes(s.id + ",")
            || school.cl_list.includes(s.id + "\x04")
        ))
        let filteredClasses = []
        classes.forEach(c => {
            if((parseInt(c.start) >= startYear
            && parseInt(c.end) <= endYear
            && selection == "p")
            || (parseInt(c.start) == startYear
            && parseInt(c.end) == endYear
            && selection == "d")) {
                filteredClasses.push(c)
            }
        })
        apply("first_year", startYear)
        apply("last_year", endYear)
        if(!req.query.all) {
            filteredClasses = filteredClasses.slice(0, 10)
        }
        let classesHTML = ""
        let index = 1;
        filteredClasses.forEach(c => {
            index++;
            let isUser = c.members.includes(utils.getAuth(req) + ",")
                      || c.members.includes(utils.getAuth(req) + "\x04");
            classesHTML += templates.schoolClassEntry(
                c, isUser, index, id
            )
        })
        code = code.replace(`<!--openk_classes-->`, classesHTML)

        code = utils.fillSchools(code, self, schools, classes)
        code = utils.fillSchools(code, self)
        
        res.send(code)
    },
    
    "create_school": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        function pullField(name) {
            if(!req.body
            || !req.body.toString().includes(name + "=")) {
                res.sendStatus(400)
                return false;
            }
            let content = decodeURIComponent(
                req.body.toString().split(name + "=")[1].split("&")[0]
            ).split("+").join(" ")
            if(content.length > 64) {
                return false;
            }
            return content;
        }
        let name = pullField("school_name")
        let address = pullField("school_address")
        let city = pullField("school_city")
        let voivodeship = pullField("voivodeship")
        let patron = pullField("patron")
        if(!name || !address || !city || !voivodeship) {
            res.sendStatus(400)
            return;
        }
        if(!voivodeships[voivodeship]) {res.sendStatus(400);return;}
        let id = Date.now()
        prv.insert("schools", {
            "name": name,
            "id": id,
            "build_photo": "/img/brakzdjecia.gif",
            "people_photo": "/img/brakzdjecia.gif",
            "threads": "",
            "cl_list": "",
            "members": utils.getAuth(req) + ",",
            "addressline": address,
            "city": city,
            "voivodeship": voivodeship,
            "patron": patron
        })
        res.redirect("/school/" + id)
    },

    "register_to_school": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("school/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        let schools = prv.pullJSON("schools")
        let school = schools.filter(s => s.id == id)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]
        let members = school.members.split(",")
        if(members.includes(utils.getAuth(req))) {
            res.sendStatus(400)
            return;
        }
        prv.update("schools", {
            "id": id
        }, {
            "members": school.members + utils.getAuth(req) + ","
        })
        res.redirect("/school/" + id)
    },

    "gen_users_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("school/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]
        let code = school_users_page_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        let users = prv.pullJSON("users")
        let schools = prv.pullJSON("schools")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let school = schools.filter(s => s.id == id)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]

        // podstawowe dane przez apply
        apply("school_id", id)
        apply("school_name", school.name)
        apply("city_name", school.city)
        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        // osoby
        let members = school.members.split("\x04").join(",").split(",").reverse()
        let membersHTML = ""
        while(members[0] == "") {
            members.shift()
        }
        members.forEach(m => {
            let user = users.filter(s => s.name == m)[0]
            membersHTML += "<td>" + templates.friendAvatar(user) + "</td>"
        })
        code = code.replace(`<!--openk_users_list-->`, membersHTML)

        // czy jesteśmy wpisani
        if(members.includes(utils.getAuth(req))) {
            code = code.replace(`openk_rh_if`, `hide`)
        }

        code = utils.fillSchools(code, self, schools)
        code = utils.fillForums(code, self)
        
        res.send(code)
    },

    "create_class": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        function pullField(name) {
            if(!req.body
            || !req.body.toString().includes(name + "=")) {
                res.sendStatus(400)
                return false;
            }
            let content = decodeURIComponent(
                req.body.toString().split(name + "=")[1].split("&")[0]
            ).split("+").join(" ")
            if(content.length > 64) {
                return false;
            }
            return content;
        }
        let name = pullField("class_name")
        let profile = pullField("class_profile")
        let teacher = pullField("class_teacher")
        let startYear = pullField("begin_year")
        let endYear = pullField("end_year")
        let school = pullField("school_id")
        if(!name || !profile || !teacher || !startYear || !endYear || !school) {
            res.sendStatus(400)
            return;
        }
        if(isNaN(parseInt(startYear))
        || parseInt(startYear) < 1930
        || parseInt(startYear) > 2030
        || isNaN(parseInt(endYear))
        || parseInt(endYear) < 1930
        || parseInt(endYear) > 2030
        || name.length > 5) {
            res.sendStatus(400)
            return;
        }

        // valid szkoła?
        let schoolObject = prv.pullJSON("schools", {"id": school}, true)
        if(!schoolObject[0]) {utils.sendStatus(req, res, 404);return;}
        schoolObject = JSON.parse(JSON.stringify(schoolObject[0]))

        // dodajemy
        let id = Date.now()
        schoolObject.cl_list += id + ","
        prv.insert("classes", {
            "id": id,
            "name": name,
            "members": "as:m" + utils.getAuth(req) + ",",
            "threads": "",
            "start": startYear,
            "end": endYear,
            "profile": profile,
            "teacher": teacher
        })
        prv.update("schools", {"id": school}, {"cl_list": schoolObject.cl_list})
        res.redirect("/school/" + school + "/" + id)
    },

    "gen_class_create_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = school_class_create_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        let id = req.originalUrl.split("school/")[1]
                 .split("/")[0].split("?")[0].split("#")[0]

        let users = prv.pullJSON("users")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let school = prv.pullJSON("schools", {"id": id}, true)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply("school_id", id)
        apply("school_name", school.name)

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "gen_class_page": function(req, res, school_id, class_id) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        let code = school_class_template;
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }
        let users = prv.pullJSON("users")
        let schools = prv.pullJSON("schools")
        let classes = prv.pullJSON("classes")
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let school = schools.filter(s => s.id == school_id)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]
        let c = classes.filter(s => s.id == class_id)
        if(!c[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        c = c[0]

        // podstawowe dane przez apply
        apply("school_id", school_id)
        apply("school_name", school.name)
        apply("school_city", school.city)
        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        apply("class_id", class_id)
        apply("class_name", c.name)
        apply("class_profile", c.profile)
        apply("class_teacher", c.teacher)
        apply("class_start", c.start)
        apply("class_end", c.end)

        // dziennik
        let classMembers = []
        c.members.split("\x04").join(",").split(",").forEach(m => {
            let tName = m.replace("as:t", "")
                         .replace("as:m", "")
                         .replace("as:g", "")
            let mo = users.filter(s => s.name == tName)
            if(mo[0]) {
                let temp = JSON.parse(JSON.stringify(mo[0]))
                temp.role = "member"
                if(m.includes("as:t")) {
                    temp.role = "teacher"
                } else if(m.includes("as:g")) {
                    temp.role = "guest"
                }
                classMembers.push(temp)
            }
        })

        let dziennikHTML = ""
        let index = 1;
        classMembers.forEach(person => {
            if(person.role == "member") {
                dziennikHTML += templates.classStudentEntry(person, index)
                index++
            }
        })
        code = code.replace(`<!--openk_student_list-->`, dziennikHTML)

        // ostatnie 2 osoby
        let latestMembers = classMembers.reverse()
        if(classMembers.length >= 2) {
            code = code.replace(`<!--openk_if_more_than_2`, "")
            code = code.replace(`openk_end_if_more_than_2-->`, "")
            apply("last2_person_id", latestMembers[1].id)
            apply(
                "last2_person_name",
                latestMembers[1].first + " " + latestMembers[1].last
            )
        }
        if(latestMembers[0]) {
            apply("last1_person_id", latestMembers[0].id)
            apply(
                "last1_person_name",
                latestMembers[0].first + " " + latestMembers[0].last
            )
        } else {
            code = code.replace(`recent_users`, `recent_users hide`)
        }

        // nauczyciele
        let teacherHTML = `<p>Nikt się jeszcze nie zapisał.</p>`
        let teachers = classMembers.filter(s => s.role == "teacher")
        if(teachers.length > 0) {
            teacherHTML = `<ul class="users">`
            teachers.forEach(t => {
                teacherHTML += templates.classMiniEntry(t)
            })
            teacherHTML += "</ul>"
        }
        code = code.replace(`<!--openk_teacher_list-->`, teacherHTML)

        // goście
        let guestHTML = `<p>Nikt się jeszcze nie zapisał.</p>`
        let guests = classMembers.filter(s => s.role == "guest")
        if(guests.length > 0) {
            guestHTML = `<ul class="users">`
            guests.forEach(t => {
                guestHTML += templates.classMiniEntry(t)
            })
            guestHTML += "</ul>"
        }
        code = code.replace(`<!--openk_guest_list-->`, guestHTML)

        // zdjęcia klasy
        let photos = prv.pullJSON("photos", {"custom_target": class_id}, true)
        let addUrl = `/profile/gallery/add?ct=${class_id}`
        let photosHTML = `<p>
            Obecnie nie ma żadnego zdjęcia – 
            <a href="${addUrl}">dodaj zdjęcie!</a>
        </p>`
        if(photos.length > 0) {
            photosHTML = ""
            photos = photos.slice(0, 5)
            photos.forEach(p => {
                let sender = users.filter(s => s.name == p.sender)[0]
                photosHTML += templates.class_mini_photo(p, sender)
            })
        }
        code = code.replace(`<!--openk_class_photos-->`, photosHTML)

        res.send(code)
    },

    "gen_gallery_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("school/")[1]
                 .split("?")[0].split("#")[0]
        let users = prv.pullJSON("users")
        let galleryHeader = "Galeria szkoły "
        let galleryPath = ""
        let photoSource = []

        // szkoła w której są zdjęcia
        let schools = prv.pullJSON("schools")
        let schoolId = id.split("/")[0]
        let school = schools.filter(s => s.id == schoolId)
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]
        galleryHeader += utils.s(school.name)
        galleryPath = templates.schoolPath(school)
        photoSource = prv.pullJSON("photos", {"custom_target": schoolId}, true)

        // klasa?
        let classElement = false;
        let classId = false;
        if(id.includes("/")) {
            classId = id.split("/")[1]
            let c = prv.pullJSON("classes", {"id": classId}, true)
            if(c[0]) {
                classElement = c[0]
                galleryHeader = "Galeria klasy " + utils.s(classElement.name)
                galleryPath = templates.classPath(classElement, school)
                photoSource = prv.pullJSON(
                    "photos", {"custom_target": classId}, true
                )
            }
        }

        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        let code = gallery_template;

        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        apply("id", id)
        apply("own_name", self.first)
        apply("own_id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)
        apply("gallery_header", galleryHeader)
        code = code.replace(`<!--openk_gallery_path-->`, galleryPath)

        // add photos html
        let photosHTML = ""
        photoSource.forEach(p => {
            let user = users.filter(s => s.name == p.sender)[0]
            photosHTML += templates.galleryPage_photo(p, user)
        })
        code = code.replace(
            `<!--openk_photos_html-->`,
            photosHTML
        )

        code = utils.fillSchools(code, self)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "class_register": function(req, res, type) {
        if(!type) {type = "member"}
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = ""
        try {
            id = req.originalUrl.split("school/")[1].split("/")[1]
        }
        catch(error) {
            res.sendStatus(400)
            return;
        }
        let classes = prv.pullJSON("classes")
        let c = classes.filter(s => s.id == id)
        if(!c[0]) {utils.sendStatus(req, res, 404);return;}
        c = JSON.parse(JSON.stringify(c[0]))

        // wywalamy membera jak już jest
        let possibles = [
            "as:m" + utils.getAuth(req),
            "as:g" + utils.getAuth(req),
            "as:t" + utils.getAuth(req)
        ]
        possibles.forEach(p => {
            c.members = c.members.replace(p + ",", "")
        })

        // dodajemy membera
        c.members += "as:" + type.substring(0, 1) + utils.getAuth(req) + ","
        prv.update("classes", {"id": id}, {"members": c.members})

        // redir
        res.redirect(req.originalUrl.replace("register_" + type, ""))
    },

    "gen_forums_page": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let id = req.originalUrl.split("school/")[1]
                 .split("?")[0].split("#")[0].split("/forum")[0]
        let code = forum_threads_template
        let users = prv.pullJSON("users")
        let schools = prv.pullJSON("schools")
        let school = false;
        let classes = prv.pullJSON("classes")
        let classroom = false;
        let forumThreads = prv.pullJSON("threads")
        let headerString = ""

        // base
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        // forum
        let threadIds = []
        school = schools.filter(s => s.id == id.split("/")[0])
        if(!school[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        school = school[0]
        if(!id.includes("/")) {
            // forum szkoły
            threadIds = school.threads.split(",").filter(s => s !== "")
            headerString = "szkoły " + utils.s(school.name)
            apply("target_id", school.id)
        } else {
            // forum klasy
            let c = classes.filter(s => s.id == id.split("/")[1])
            if(!c[0]) {
                utils.sendStatus(req, res, 404)
                return;
            }
            c = c[0]
            threadIds = c.threads.split(",").filter(s => s !== "")
            headerString = "klasy " + utils.s(c.name)
            classroom = c
            apply("target_id", c.id)
        }
        apply("header", headerString)
        apply("school_id", school.id)

        // lista
        let threads = []
        threadIds.forEach(t => {
            t = forumThreads.filter(s => s.id == t)
            if(t[0]) {
                threads.push(t[0])
            }
        })
        let threadsHTML = ""
        let i = 0;
        threads.forEach(t => {
            threadsHTML += templates.forumThread(t, i, users)
            i++
        })
        code = code.replace(`<!--openk_forum_threads-->`, threadsHTML)

        // path na górze, przycisk zapisz się
        if(classroom) {
            code = code.replace(
                `<!--openk_path-->`,
                templates.classPath(classroom, school)
            )
        } else {
            code = code.replace(
                `<!--openk_path-->`,
                templates.schoolPath(school)
            )
        }
        if(school.members.includes(utils.getAuth(req))) {
            code = code.replace(`openk_rh_if`, `hide`)
        }
        code = utils.fillSchools(code, self, schools, classes, false)
        code = utils.fillForums(code, self)

        res.send(code)
    },

    "create_forum": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let target = ""
        let threadName = ""
        if(!req.body
        || !req.body.toString().includes("target=")
        || !req.body.toString().includes("thread_name=")) {
            res.sendStatus(400)
            return;
        }
        target = req.body.toString().split("target=")[1].split("&")[0]
        threadName = decodeURIComponent(
            req.body.toString().split("thread_name=")[1].split("&")[0]
        ).split("+").join(" ")
        if(threadName.length < 1) {res.sendStatus(400);return;}
        
        // preconditioni: target istnieje i użytkownik jest w target
        let schools = prv.pullJSON("schools")
        let classrooms = prv.pullJSON("classes")

        let targetObject;
        let targetList = "schools"
        if(schools.filter(s => s.id == target)[0]) {
            targetObject = schools.filter(s => s.id == target)[0]
        } else if(classrooms.filter(s => s.id == target)[0]) {
            targetList = "classes"
            targetObject = classrooms.filter(s => s.id == target)[0]
        }

        if(!targetObject) {
            utils.sendStatus(req, res, 404)
            return;
        }

        if(!targetObject.members.includes(utils.getAuth(req))) {
            res.sendStatus(400)
            return;
        }

        // tworzymy thread
        let postId = Date.now()
        let threadId = Date.now() - 100
        prv.insert("forum_posts", {
            "id": postId,
            "name": utils.getAuth(req),
            "content": threadName
        })
        prv.insert("threads", {
            "id": threadId,
            "name": threadName,
            "post_ids": postId + ","
        })
        prv.update(targetList, {"id": target}, {
            "threads": targetObject.threads + threadId + ","
        })

        // dodawanie threadu do followed przez użytkownika
        let follows = prv.pullJSON("followed_forums")
        let followedForumList = ""
        if(follows.filter(s => s.name == utils.getAuth(req))[0]) {
            followedForumList = follows.filter(
                s => s.name == utils.getAuth(req)
            )[0].threads.split("\x04").join(",")
        } else {
            prv.insert("followed_forums", {
                "name": utils.getAuth(req),
                "threads": " "
            })
        }
        followedForumList += threadId + ":" + postId + ","
        prv.update("followed_forums", {"name": utils.getAuth(req)}, {
            "threads": followedForumList
        })

        
        res.redirect("/forum/" + threadId)
    },

    "gen_forum_thread": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let code = forum_thread_template
        let id = req.originalUrl.split("forum/")[1]
                 .split("?")[0].split("#")[0].split("/")[0]
        let users = prv.pullJSON("users")
        let schools = prv.pullJSON("schools")
        let classes = prv.pullJSON("classes")
        let threads = prv.pullJSON("threads")
        let posts = prv.pullJSON("forum_posts")

        // base
        let self = users.filter(s => s.name == utils.getAuth(req))[0]
        function apply(field, content) {
            code = code.split("openk_" + field)
                   .join(utils.xss(decodeURIComponent(content)))
        }

        apply("imie", self.first)
        apply("id", self.id)
        apply("friends_count", utils.getFriendCount(self))
        let follows = utils.getSledzikFollows(utils.getAuth(req))
        apply("follower_count", follows.followers.length)
        apply("following_count", follows.following.length)

        if(!threads.filter(s => s.id == id)[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }

        // gdzie jest thread!!
        let schoolMatches = schools.filter(
            s => s.threads.includes(id + ",") || s.threads.includes(id + "\x04")
        )
        let classMatches = classes.filter(
            s => s.threads.includes(id + ",") || s.threads.includes(id + "\x04")
        )
        if(!schoolMatches[0] && !classMatches[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        if(classMatches[0]) {
            schoolMatches = schools.filter(
                s => s.cl_list.includes(id + ",") || s.cl_list.includes(id + "\x04")
            )
            code = code.replace(
                `<!--openk_forum_path-->`,
                templates.classPath(classMatches[0], schoolMatches[0])
            )
        } else {
            code = code.replace(
                `<!--openk_forum_path-->`,
                templates.schoolPath(schoolMatches[0])
            )
        }

        let school = schoolMatches[0]
        apply("school_id", school.id)
        if(school.members.includes(utils.getAuth(req))) {
            code = code.replace(`openk_rh_if`, `hide`)
        }
        code = utils.fillSchools(code, self, schools, classes, false)

        // thread!!
        let thread = threads.filter(s => s.id == id)[0]
        let threadPosts = []
        let postIds = thread.post_ids.split("\x04").join(",")
                            .split(",").filter(s => s !== "")
        postIds.forEach(p => {
            p = posts.filter(s => s.id == p)
            if(p[0]) {threadPosts.push(p[0])}
        })
        apply("forum_thread_name", thread.name)
        apply("target_id", id)

        let postsHTML = ""
        threadPosts.forEach(post => {
            let poster = users.filter(s => s.name == post.name)[0]
            postsHTML += templates.forumPost(post, poster)
        })
        code = code.replace(`<!--openk_posts-->`, postsHTML)

        // oznaczamy jako odczytane jak potrzeba
        let forumFollows = prv.pullJSON("followed_forums")
        let followedForumList = ""
        if(forumFollows.filter(s => s.name == utils.getAuth(req))[0]) {
            try {
                followedForumList = forumFollows.filter(
                    s => s.name == utils.getAuth(req)
                )[0].threads.split("\x04").join(",")
                let lastReadPost = followedForumList.split(id + ":")[1].split(",")[0]
                let lastPost = postIds[postIds.length - 1]
                followedForumList = followedForumList.replace(
                    target + ":" + lastReadPost, target + ":" + lastPost
                )
                prv.update("followed_forums", {"name": utils.getAuth(req)}, {
                    "threads": followedForumList
                })
            }
            catch(error) {}
        }

        code = utils.fillForums(code, self, users, false, forumFollows)
        res.send(code)
    },

    "forum_add_post": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}
        let target = ""
        let post = ""
        if(!req.body
        || !req.body.toString().includes("target=")
        || !req.body.toString().includes("content=")) {
            res.sendStatus(400)
            return;
        }
        target = req.body.toString().split("target=")[1].split("&")[0]
        post = decodeURIComponent(
            req.body.toString().split("content=")[1].split("&")[0]
        ).split("+").join(" ")

        // preconditioni: target istnieje i użytkownik jest w szkole/klasie
        // w której jest thread
        let threads = prv.pullJSON("threads", {"id": target}, true)
        if(!threads[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        let thread = JSON.parse(JSON.stringify(threads[0]))
        let schools = prv.pullJSON("schools")
        let classes = prv.pullJSON("classes")
        let ts = schools.filter(
            s => s.threads.split("\x04").join(",").includes(target + ",")
        )
        let tc = classes.filter(
            s => s.threads.split("\x04").join(",").includes(target + ",")
        )
        if(!ts[0] && !tc[0]) {
            utils.sendStatus(req, res, 404)
            return;
        }
        let isSchoolMember = false;
        let isClassMember = false;
        try {
            isSchoolMember = ts[0].members.split("\x04").join(",")
                                  .includes(utils.getAuth(req) + ",")
        }catch(error) {}
        try {
            isClassMember = tc[0].members.split("\x04").join(",")
                                 .includes(utils.getAuth(req) + ",")
        }catch(error) {}
        if(!isSchoolMember && !isClassMember) {
            res.sendStatus(400)
            return;
        }
        if(post.trim().length < 1) {res.sendStatus(400);return;}

        // koniec preconditioni!!

        // dodawanie postu
        let newPostId = Date.now()
        prv.insert("forum_posts", {
            "id": newPostId,
            "name": utils.getAuth(req),
            "content": post
        })
        prv.update("threads", {"id": target}, {
            "post_ids": thread.post_ids + newPostId + ","
        })
        
        // dodawanie threadu do followed przez użytkownika
        let follows = prv.pullJSON("followed_forums")
        let followedForumList = ""
        if(follows.filter(s => s.name == utils.getAuth(req))[0]) {
            followedForumList = follows.filter(
                s => s.name == utils.getAuth(req)
            )[0].threads.split("\x04").join(",")
        } else {
            prv.insert("followed_forums", {
                "name": utils.getAuth(req),
                "threads": " "
            })
        }
        if(!followedForumList.includes(target + ":")) {
            followedForumList += target + ":" + newPostId + ","
        } else {
            let lastPost = followedForumList.split(target + ":")[1].split(",")[0]
            followedForumList = followedForumList.replace(
                target + ":" + lastPost, target + ":" + newPostId
            )
        }
        prv.update("followed_forums", {"name": utils.getAuth(req)}, {
            "threads": followedForumList
        })

        res.redirect("/forum/" + target + "#post_" + newPostId)
    },

    "get_your_schools": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        let code = school_list_template;
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

        code = utils.fillSchools(code, self);
        code = utils.fillSchools(code, self);
        code = utils.fillForums(code, self, users);

        res.send(code)
    },

    "get_your_forums": function(req, res) {
        if(!utils.getAuth(req)) {res.redirect("/");return;}

        let code = forum_list_template;
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

        code = utils.fillSchools(code, self);
        code = utils.fillForums(code, self, users);
        code = utils.fillForums(code, self, users);

        res.send(code)
    }
}