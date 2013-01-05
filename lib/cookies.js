var querystring = require('querystring'),
    http = require('http');


module.exports = exports = function (email, password, token, callback) {
    var data = querystring.stringify({
        'utf8': '✓',
        'authenticity_token': token,
        'user[email]': email,
        'user[password]': password,
        'user[remember_me]': '1',
        'commit': 'Войти'
    });

    var options = {
        hostname: 'freelansim.ru',
        path: '/users/sign_in',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': data.length
        }
    };

    var req = http.request(options, function (res) {
        var cookies = [];

        res.headers['set-cookie'].forEach(function (setCookie) {
            cookies.push(setCookie.split(';')[0]);
        });

        callback(null, cookies.join('; '));
    });

    req.write(data);
    req.end();
};
