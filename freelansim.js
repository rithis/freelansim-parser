// configuration
var nconf = require('nconf');

nconf.env('__');
nconf.file(__dirname + '/config.json');

nconf.defaults({
    'interval': 5 * 60 * 1000 // 5 minutes
});


// logging
var winston = require('winston');
var logger = new winston.Logger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: __dirname + '/process.log'})
    ],
    exceptionHandlers: [
        new winston.transports.Console({json: true}),
        new winston.transports.File({filename: __dirname + '/exceptions.log'})
    ],
    exitOnError: false
});

if (nconf.get("loggly:subdomain") && nconf.get("loggly:token")) {
    logger.add(require('winston-loggly').Loggly, {
        subdomain: nconf.get("loggly:subdomain"),
        inputToken: nconf.get("loggly:token"),
        handleExceptions: true,
        json: true
    });
}

if (!nconf.get('email') && !nconf.get('password') && !nconf.get('cookies')) {
    logger.error("No credentials provided");
    process.exit(1);
}


// functions
var async = require('async');

var balances;
var balance;
var positions;
var position;
var cookiesString;

var token = require('./lib/token');
var cookies = require('./lib/cookies');
var server = require('./server/server');

var info = function (cookies, callback) {
    logger.info("Fetching information");
    require('./lib/info')(cookies, callback);
};

var result = function (error, currentBalance, currentPosition) {
    if (currentPosition == 0) {
        logger.warn("Status", {balance: currentBalance, position: currentPosition});
        return;
    }

    logger.info("Status", {balance: currentBalance, position: currentPosition});

    if (currentBalance !== balance) {
        balances.insert({value: currentBalance, date: new Date()}, function (error) {
            if (!error) {
                logger.info("Updated balance", {balance: currentBalance, old: balance});
                balance = currentBalance;
            }
        });
    }

    if (currentPosition !== position) {
        positions.insert({value: currentPosition, date: new Date()}, function (error) {
            if (!error) {
                logger.info("Updated position", {position: currentPosition, old: position});
                position = currentPosition;
            }
        });
    }
};

var preload = function (callback) {
    balances = new mongodb.Collection(client, 'balances');
    positions = new mongodb.Collection(client, 'positions');

    async.parallel([
        function (callback) {
            balances.findOne({}, {sort: {date: -1}}, function (error, result) {
                if (result) {
                    balance = result.value;
                }
                callback(null);
            });
        },
        function (callback) {
            positions.findOne({}, {sort: {date: -1}}, function (error, result) {
                if (result) {
                    position = result.value;
                }
                callback(null);
            });
        }
    ], callback);
};

var iteration = function () {
    if (cookiesString) {
        info(cookiesString, result);

    } else {
        var waterfall = [
            function (callback) {
                logger.info("Fetching token");
                token(callback);
            },

            function (token, callback) {
                logger.info("Signing in", {token: token});
                cookies(nconf.get('email'), nconf.get('password'), token, callback);
            },

            function (cookies, callback) {
                logger.info("Remember cookies");
                cookiesString = cookies;
                callback(null, cookies);
            },

            function (cookies, callback) {
                info(cookies, callback);
            },
        ];

        async.waterfall(waterfall, result);
    }
};

var loop = function () {    
    preload(function () {
        iteration();
        
        var port = process.env.VCAP_APP_PORT || 3000;
        logger.info("Staring server", {port: port})
        server(balances, positions, port);
    });
    setInterval(iteration, nconf.get('interval'));
};


// process
var credentials;
if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    credentials = env['mongodb-1.8'][0]['credentials'];
} else {
    credentials = {
        'hostname': 'localhost',
        'port': 27017,
        'db': 'freelansim'
    }
}

var mongodb = require('mongodb');
var client = new mongodb.Db(credentials.db, new mongodb.Server(credentials.hostname, credentials.port));

client.open(function (error) {
    if (error) {
        logger.error("Can't connect to database", credentials);
        process.exit(2);

    } else if (credentials.username && credentials.password) {        
        client.authenticate(credentials.username, credentials.password, function (error) {
            if (error) {
                logger.error("Can't authenticate", credentials);
                process.exit(3);

            } else {
                loop();   
            }
        });
    } else {
        loop();
    }
});
