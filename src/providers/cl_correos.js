const request = require('request').defaults({ followAllRedirects: true });
const cheerio = require('cheerio');
module.exports = CorreosChile;

/**
 * Retorna el estado de un envío. 
 */

function CorreosChile() {
    this.name = 'Correos Chile';
    this.getStatus = getStatus;
    let url = 'http://seguimientoweb.correos.cl/ConEnvCorreos.aspx';

    function getStatus(code) {
        return new Promise((resolve, reject) => {
            let opts = {
                uri: url,
                form: {
                    'obj_key': 'Cor398-cc',
                    'obj_env': code
                }
            };

            request.post(opts, (err, res, data) => {
                if(err !== null) {
                    return reject(err);
                }

                if(!data) {
                    return reject('No se recibieron datos');
                }

                // Cargar datos
                let $ = cheerio.load(data);
                let t = $('.tracking tr');

                // Tabla de estados no existe
                if(t.length <= 0) {
                    if($('.envio_no_existe').length > 0) {
                        // Muestra error de que el envío no existe
                        reject('notfound');
                    } else {
                        // Error no identificado
                        console.log(data);
                        reject('error');
                    }

                    return;
                }

                // Está la tabla, pero sin estados
                if(t.length < 2) {
                    resolve(null);
                    return;
                }

                // Cargar el último estado (la primera fila)
                let td = $('td', t.eq(1));
                let status = td.eq(0).text().replace(/&nbsp;/g, '').trim();
                let date = parseDate(td.eq(1).text().replace(/&nbsp;/g, '').trim()); // ej 03/01/2017 4:50
                let location = td.eq(2).text().replace(/&nbsp;/g, '').trim();
                let delivered = $('#Panel_Entrega').length > 0;
                let deliveryInfo = null;

                if(delivered) {
                    let dit = $('#Panel_Entrega .datosgenerales');
                    deliveryInfo = {
                        receiver: $('td', dit).eq(3).text().replace(/&nbsp;/g, '').trim(),
                        date: parseDate($('td', dit).eq(5).text().replace(/&nbsp;/g, '').trim()),
                        rut: $('td', dit).eq(7).text().replace(/&nbsp;/g, '').trim()
                    };
                }

                resolve({
                    code: code,
                    status: status,
                    date: date,
                    location: location,
                    delivered: delivered,
                    deliveryInfo: deliveryInfo
                });
            });
        });
    }
}

function parseDate(dateStr) {
    let two = dateStr.split(' ');
    let date = two[0];
    let time = two[1];
    let dateEls = date.split('/');
    let hourEls = time.split(':');

    let parsed = new Date(
        Date.UTC(dateEls[2], parseInt(dateEls[1])-1, dateEls[0], hourEls[0], hourEls[1])
    );

    // agregar 3 horas para mover a UTC
    parsed.setTime(parsed.getTime()+(60*60*3));

    return parsed;
}