var cheerio = require('cheerio'),
    http = require('http');


module.exports = exports = function (callback) {
    var options = {
        hostname: 'freelansim.ru',
        path: '/users/sign_in',
        method: 'GET'
    };

    var req = http.request(options, function (res) {
        var content = '';

        res.on('data', function (data) {
            content += data.toString();
        });

        res.on('end', function () {
            var $ = cheerio.load(content);
            var token = $('meta[name=csrf-token]').attr('content');

            callback(null, token);
        });
    });

    req.end();
};
