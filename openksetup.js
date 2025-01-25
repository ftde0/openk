const fs = require("fs")
const readline = require("readline-sync")
let cfg = {}

console.log(`


[openk setup]`)


// port
let port;
while(isNaN(parseInt(port))) {
    port = parseInt(
        readline.question("\nwhat port should openk run on? ")
    )
}
cfg.port = port;
cfg.sslEnable = false;

console.log(`
do you want to use SSL on a second port?`)
let rawSSlResponse = ""
while(rawSSlResponse !== "n"
&& rawSSlResponse !== "y") {
    rawSSlResponse = readline.question("use SSL? (y/n): ")
}
if(rawSSlResponse.toLowerCase() == "y") {
    cfg.sslEnable = true;

    // SSL file paths and port
    cfg.sslCert = readline.question(
        "\nspecify an absolute path to your ssl **certificate**.: "
    )
    cfg.sslKey = readline.question(
        "\nspecify an absolute path to your ssl **private key**.: "
    )
    while(isNaN(parseInt(cfg.sslPort))
    || cfg.port == cfg.sslPort) {
        cfg.sslPort = readline.question(
            "\nspecify a different port for the SSL openk version: "
        )
    }
}

// tokens
let rawTokens = ""
while(rawTokens !== "n"
&& rawTokens !== "y") {
    rawTokens = readline.question(
        "\n\ndisable tokens requirement? will set tokens as [\"*\"]. (y/n): "
    ).toLowerCase()
    if(rawTokens == "y") {
        cfg.tokens = ["*"]
    } else {
        let randomTokens = []
        let dict = "qwertyuiopasdfghjklzxcvbnm1234567890".split("")
        while(randomTokens.length !== 10) {
            let token = ""
            while(token.length !== 6) {
                token += dict[Math.floor(Math.random() * dict.length)]
            }
            randomTokens.push(token)
        }
        cfg.tokens = randomTokens;
        console.log("writing 10 random tokens:\n" + randomTokens.join(", "))
        console.log("you can always check or change those in config.json.")
    }
}

// confirmation
console.log(`
writing configuration to config.json.
you can always rerun this setup in the future to make changes.
`)
fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(cfg))
console.log(`
you can now run
======
node back.js
======
to start openk.
`)
