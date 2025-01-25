const fs = require("fs")
const separators = ["\x00", "\x01", "\x02", "\x03", "\x05", "\x06", "\x07"]

let dbFriendlyData = {}

function sanitize(t) {
    if(!t) {t = ""}
    try {
        t = t.toString()
    }catch(error) {t = JSON.stringify(t)}
    separators.forEach(sm => {
        if(t.includes(sm)) {
            t = t.split(sm).join("")
        }
    })
    if(t.includes(",")) {
        t = t.split(",").join("\x04")
    }
    return t;
}

function s() {
    let sd = ""
    for(let t in dbFriendlyData) {
        sd += `${separators[0]}${separators[0]}${sanitize(t)}${separators[0]}\n${separators[1]}${separators[6]}`
        let cst = []
        dbFriendlyData[t].schema.forEach(cn => {
            cst.push(sanitize(cn))
        })
        sd += `${cst.join("-")}${separators[5]}`
        let et = []
        dbFriendlyData[t].r.forEach(e => {
            let tet = []
            for(let cn in e) {
                let i = dbFriendlyData[t].schema.indexOf(cn)
                tet[i] = sanitize(e[cn]);
            }
            tet = tet.join(",")
            et.push(tet)
        })
        et.length > 0 ? sd += `\n${separators[4]}` : ""
        sd += `${et.join(",")}\n${separators[2]}\n`
    }
    return sd;
}

function initFromFile() {
    if(!fs.existsSync(`${__dirname}/prvdb.data`)) {
        fs.copyFileSync(`${__dirname}/prvdb-default.data`, `${__dirname}/prvdb.data`)
    }
    let d = ""
    try {
        d = fs.readFileSync("./prvdb.data").toString();
    }
    catch(e) {try {
        d = fs.readFileSync("./backend_modules/prvdb.data").toString()
    } catch(e) {}}
    d.split(separators[0] + separators[0]).forEach(e => {
        if(e.length < 1) return;
        let n = e.split(separators[0])[0]
        let td = e.split(separators[0])[1].replace(separators[1] + separators[6], "")
        let tn = td.split(separators[5])[0].split("-")
        let tn2 = []
        tn.forEach(t => {
            tn2.push(t.split("\n").join("").split("\r").join(""))
        })
        dbFriendlyData[n] = {"schema": tn2}
        let d = td.split(separators[5])[1].split(separators[2])[0]
        if(d.includes(separators[3]) || d.length < 5) {
            dbFriendlyData[n].r = []
        } else {
            let ei = 0;
            let f = []
            let t = {}
            d.split(separators[4]).join("").split(",").forEach(g => {
                g = g.split("\n").join("").split("\r").join("")
                if(g.includes("\x04")) {
                    g = g.split("\x04").join(",")
                }
                t[tn2[ei]] = g;
                ei++
                if(tn2.length == ei) {
                    f.push(JSON.parse(JSON.stringify(t)))
                    t = {}
                    ei = 0;
                }
            })
            dbFriendlyData[n].r = JSON.parse(JSON.stringify(f))
        }
    })
}
initFromFile();

module.exports = {
    "insert": function(t, d, b) {
        let sD = {}
        for(let c in d) {
            if(dbFriendlyData[t].schema.includes(c)) {
                sD[c] = sanitize(d[c])
            }
        }
        if(!b) {
            dbFriendlyData[t].r.push(sD)
        } else {
            dbFriendlyData[t].r.unshift(sD)
        }
    },

    "pull": function(t, q = "") {
        return dbFriendlyData[t].r.filter(s => JSON.stringify(s).includes(q))
    },

    "pullJSON": function(t, q, s) {
        let m = []
        if(!q) {
            return dbFriendlyData[t].r;
        }
        let mf = {}
        dbFriendlyData[t].r.forEach(r => {
            for(let c in q) {
                if((s && r[c] == q[c]
                || !s && r[c].includes(q[c]))
                && q[c] !== null
                && q[c] !== undefined) {
                    if(!mf[c]) {mf[c] = []}
                    mf[c].push(r)
                }
            }
        })
        let af = []
        for(let f in mf) {
            af.push(f)
        }
        af.forEach(f => {
            mf[f].forEach(f2 => {
                let af2 = af.filter(s2 => s2 !== f)
                af2.forEach(f3 => {
                    if(mf[f3].includes(f2)
                    && !m.includes(f2)) {
                        m.push(f2)
                    }
                })
                if(af2.length == 0) {
                    m.push(f2)
                }
            })
        })
        return m;
    },

    "getCount": function(t) {
        return dbFriendlyData[t].r.length
    },

    "update": function(t, q, nd) {
        let d = this.pullJSON(t, q, true)[0]
        let tm = JSON.parse(JSON.stringify(d))
        for(let c in nd) {
            if(tm[c] !== null && tm[c] !== undefined) {
                tm[c] = nd[c]
            }
        }
        let i = dbFriendlyData[t].r.indexOf(d)
        dbFriendlyData[t].r[i] = tm;
        return tm;
    },

    "delete": function(t, q) {
        let d = this.pullJSON(t, q, true)
        d.forEach(e => {
            if(e.time) {
                dbFriendlyData[t].r = dbFriendlyData[t].r.filter(s => s.time !== e.time)
            } else if(e.id) {
                dbFriendlyData[t].r = dbFriendlyData[t].r.filter(s => s.id !== e.id)
            }
        })
    }
}

function sd() {
    if(fs.existsSync("./prvdb.data")) {
        try {fs.writeFileSync("./prvdb.data", s())}
        catch(error) {console.log(error, s())}
    } else if(fs.existsSync("./backend_modules/prvdb.data")) {
        try {fs.writeFileSync("./backend_modules/prvdb.data", s())}
        catch(error) {console.log(error, s())}
    }
}
const x = setInterval(() => {
    sd();
}, 1000 * 60 * 15)