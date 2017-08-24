// owo
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const Correos = require('./src/providers/cl_correos');

let correos = new Correos();
let user = null;
let statuses = {};
let updated = false;

if(config.key === '') {
    console.log('no key lol');
    process.exit(1);
}
if(config.userDest === '') {
    console.log('no user dest lol');
    process.exit(1);
}

client.login(config.key);
client.on('ready', () => {
    console.log(`bot logueado como ${client.user.tag}!`);
    user = client.fetchUser(config.userDest).then(resultUser => {
        user = resultUser;
        console.log('bot inicializado');
        loop();
    }).catch(err => {
        console.error('no se pudo obtener el usuario');
        console.error(err);
        process.exit(1);
    });
});

let count = 0;
function loop() {
    correos.getStatus(config.codes[count++]).then(result => {
        callback(result);
        if(count >= config.codes.length) {
            count = 0;
            if(updated) {
                console.log('listo por ahora, esperando 60 segs...');
                updated = false;
            }
            setTimeout(loop, 60000);
        } else {
            loop();
        }
    }).catch(err => {
        console.error(err);
        count--;
        console.error('esperando 10 segs...');
        setTimeout(loop, 10000);
    });
}

function callback(result) {
    if(result === null) {
        user.send('no hay datos para tu envio');
        return;
    }

    if(!statuses.hasOwnProperty(result.code)) {
        statuses[result.code] = null;
    }

    let date = result.date.toString();
    if(statuses[result.code] !== date) {
        statuses[result.code] = date;
        console.log(`código ${result.code}: ${result.location}, ${result.status}`);
        user.send(`código ${result.code}: ${result.location}, ${result.status}`);
        updated = true;
    }
}
