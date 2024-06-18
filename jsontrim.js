var jsonrepair = require('jsonrepair')
const fs = require('fs');

async function trimNest(obj) {
    for(const k in obj) {
        if(typeof obj[k] == "object") {
            trimNest(obj[k])
        } else if(typeof obj[k] == "string") {
            obj[k] = obj[k].trim();
        }
    }
}

async function main() {
    var data = fs.readFileSync('data.json', 'utf8');
    data = JSON.parse(jsonrepair.jsonrepair(data))
    trimNest(data);

    fs.writeFileSync('data.json', JSON.stringify(data, null, 2))
}

main();