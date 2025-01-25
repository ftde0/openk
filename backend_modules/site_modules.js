const prv = require("./prvdb")
const utils = require("./utils")
const imieniny = require("./imieniny_table.json")

module.exports = {
    "might_know": function(req, res) {
        if(!utils.getAuth(req)) {res.sendStatus(401);return;}
        let users = JSON.parse(JSON.stringify(prv.pullJSON("users", false)))
        let response = {
            "UID": [],
            "SEX": [],
            "FIRST_NAME": [],
            "LAST_NAME": [],
            "AVATAR": [],
            "FRIENDS_COUNT": [],
            "CITY": [],
            "RANK": [],
            "ARTIFICIALITY": [],
            "SOURCE": [],
            "LINK": []
        }
        let friends = utils.getUserFriends(
            users.filter(s => s.name == utils.getAuth(req))[0]
        )

        users = users.filter(s => s.name !== utils.getAuth(req))
        users = users.filter(s => !friends.includes(s.id.toString()))
        users = users.slice(0, 6)
        
        users.forEach(u => {
            let photoId = u.photo_path
            let photoPath = u.photo_path
            if(!photoPath.includes("brak")) {
                photoId = photoPath.split("/user_assets/")[1].split(".")[0]
                photoPath = "/get_thumb?id=" + photoId
            }
            response.UID.push(u.id)
            response.SEX.push(u.gender)
            response.FIRST_NAME.push(utils.s(u.first))
            response.LAST_NAME.push(utils.s(u.last))
            response.AVATAR.push(photoPath)
            response.FRIENDS_COUNT.push(u.friend_ids.split(",").length - 1)
            response.CITY.push(utils.s(u.city))
            response.RANK.push(0),
            response.ARTIFICIALITY.push(u.fictional)
            response.SOURCE.push("")
            response.LINK.push("/profile/" + u.id)
        })

        res.send(response)
    },

    "calendar": function(req, res) {
        if(!utils.getAuth(req)) {res.sendStatus(401);return;}
        let oneDay = 1000 * 60 * 60 * 24
        let fiveDays = [
            new Date(),
            new Date(Date.now() + oneDay),
            new Date(Date.now() + (oneDay * 2)),
            new Date(Date.now() + (oneDay * 3)),
            new Date(Date.now() + (oneDay * 4))
        ]
        function displayFormatDate(time) {
            let formattedTime = ""
            let d = time.getDate()
            let m = time.getMonth() + 1
            let y = time.getFullYear()
            formattedTime += d < 10 ? "0" + d : d
            formattedTime += "." + (m < 10 ? "0" + m : m)
            formattedTime += "." + y + " "
            return formattedTime;
        }
        function tableFormatDate(time) {
            let d = time.getDate()
            let m = time.getMonth() + 1
            return d + "." + m;
        }
        let dayDisplayNames = [
            "dzisiaj",
            "jutro",
            displayFormatDate(fiveDays[2]),
            displayFormatDate(fiveDays[3]),
            displayFormatDate(fiveDays[4])
        ]
        let displayData = []
        let dayIndex = 0;
        fiveDays.forEach(day => {
            displayData.push({
                "name":"imieniny obchodz\u0105","url":"","value":"2",
                "location": dayDisplayNames[dayIndex],
                "desc": imieniny[tableFormatDate(day)].join(", ")
            })
            dayIndex++
        })
        res.send([1,[[{
            "name":"Tw\u00f3j Kalendarz","id":4,"offset":0,"hidden":false,
            "full_offer_url":"http:\/\/www.pocztakwiatowa.pl\/","type":"4",
            "items":[
                1,{"id":4,"type":"4","offset":0,"data":displayData,
                "show_next":false,"show_prev":false}
            ]}],false
        ]])
    }
}