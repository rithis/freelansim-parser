var cheerio = require('cheerio'),
    http = require('http');


module.exports = exports = function (cookies, callback) {
    var options = {
        hostname: 'freelansim.ru',
        path: '/tasks',
        method: 'GET',
        headers: {
            Cookie: cookies
        }
    };

    var req = http.request(options, function (res) {
        var content = '';

        res.on('data', function (data) {
            content += data.toString();
        });

        res.on('end', function () {
            var $ = cheerio.load(content);
            
            var balance = Number($('.user_stat .my_balance b').text());
            var position = Number($('.user_stat .top b').text());
            
            callback(null, balance, position);
        });
    });

    req.end();
};
