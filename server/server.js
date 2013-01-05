module.exports = exports = function (balances, positions, port) {
    var express = require('express');
    var app = express();

    app.use(express.static(__dirname + '/public'));

    app.get('/', function (req, res) {
        res.sendfile(__dirname + '/views/index.html');
    });

    var sources = [
        ['/balances', balances],
        ['/positions', positions]
    ];

    sources.forEach(function (source) {
        var url = source[0];
        var collection = source[1];

        app.get(url, function (req, res) {
            collection.find(function (error, cursor) {
                if (error) {
                    res.send(500);
                } else {
                    cursor.toArray(function (error, result) {
                        if (error) {
                            res.send(500);
                        } else {
                            res.send(result);
                        }
                    });
                }
            });
        });
    });

    app.listen(port);
};
