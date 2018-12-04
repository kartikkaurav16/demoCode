'use strict';

var config = require('config');
var mongoose = require('mongoose');
var dotenv = require('dotenv');
var logger = require('./newLogger');
var autoIncrement = require('mongoose-auto-increment');
var connection = mongoose.connection;
var pingURL = null;

var retry_count = 0;

var MAX_retry_count = 10;

if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

var db = module.exports = {
    connecting: false,
    connected: false,
    errObject: null,
    connectionInfo: null,
    ping: ping
};

function loadConfig() {
    dotenv.config({silent: false});
    var prefix = process.env.MONGODB_SVC_NAME;

    return {
        "db.name": process.env.DB_NAME
        , "db.replica_set": process.env.REPLICA_SET
        , "db.host": process.env[prefix + '_SERVICE_HOST']
        , "db.port": process.env[prefix + '_SERVICE_PORT']
        , "db.login": process.env.DB_LOGIN
        , "db.password": process.env.DB_PASSWORD
        , has: function (key) {
            return this.hasOwnProperty(key) && typeof this[key] !== 'function';
        }
        , get: function (key) {
            if (typeof this[key] !== 'function') {
                return this[key];
            }
            return null;
        }
    };
}

db.setup = function () {
    var options, uri;
    var config = loadConfig();
    var dbName = config.get('db.name');
    var host = config.get('db.host');
    var mongoStr = mongoString(config.get('db.host'), config.get('db.port'));
    var port = config.get('db.port');
    var login = "";
    var username = config.get('db.login');
    var password = config.get('db.password');
    var replica_set = config.get('db.replica_set');
    var HOSTPORTSTR = "";

    db.connectionInfo = HOSTPORTSTR;

    logger.info('db connecting: ' + this.connecting);

    if (this.connecting || this.connected) {
        return;
    }

    if (process.env.hasOwnProperty(process.env.MONGODB_SVC_NAME + '_SERVICE_URI')) {
        uri = process.env[process.env.MONGODB_SVC_NAME + '_SERVICE_URI'];
    } else {
        //Old Implementation
        if (host.indexOf(':') > -1) {
            console.log("<--EVEN OLDER IMPLEMENTATION --> : " + host);
            HOSTPORTSTR = host + ':' + port;
        } else {
            console.log("<--OLD IMPLEMENTATION --> : " + mongoStr);
            HOSTPORTSTR = mongoStr;
        }

        if (process.env.DB_LOGIN && process.env.DB_PASSWORD) {
            login = username + ':' + password + '@';
        }

        if (config.get('db.name')) {
            uri = 'mongodb://' + login + HOSTPORTSTR + '/' + dbName;
        } else {
            uri = 'mongodb://' + login + HOSTPORTSTR;
        }

        if (config.get('db.replica_set')) {
            uri += "?replicaSet=" + replica_set;
        }
    }


    connection.once('connected', function () {
        logger.info('db connection established');
        db.connected = true;
    });

    connection.on('disconnecting', function () {
        logger.info('db connection disconnecting');
    });

    connection.on('error', function (err) {
        logger.error('db error occurred :' + err);
        mongoose.disconnect();
        db.errObject = {
            message: err,
            code: "EBF-SBP-500-*",
            timeStamp: logger.getDate(),
            supportEmail: config.get('support.email')
        };

    });

    //assign uri to global variable for ping function
    pingURL = uri;

    // Connect to Database
    this.connecting = true;
    mongoose.Promise = global.Promise;
    var options = {};
    console.log("URI : "+uri);
    connection.on('disconnected', function () {
        retry_count++;
        logger.error('MongoDB disconnected!');
        if (retry_count < MAX_retry_count) {
            mongoose.connect(uri, options);
        } else {
            process.exit(1);
        }
    });
    mongoose.connect(uri, options);
    autoIncrement.initialize(mongoose.connection);
    logger.debug(mongoose.connection.readyState);
};

process.on('SIGINT', function (err) {
    if (db.connected) {
        mongoose.connection.close(function () {
            console.log('default connection disconnected through app termination' + err);
            process.exit();
        });
    }

});

process.on('uncaughtException', function (err) {
    console.log('default connection disconnected through app uncaught exception' + err);
});

function mongoString(str, port) {
    var returnString = "";
    if (str != "" || str != null || str != "" || str != undefined) {
        try {
            var arr = str.split(',');
            for (var i = 0; i < arr.length; i++) {
                i != (arr.length - 1) ? returnString += arr[i] + ':' + port + ',' : returnString += arr[i] + ':' + port;
            }
        }
        catch (e) {
            console.log("Something went wrong : " + e);
        }
    }
    return returnString;
};

//Used to check DB Health
function ping(cb) {
    var pingConnection = new mongoose.Connection();

    //Establish a connection
    pingConnection.open(pingURL, function (error) {
        if (error) {
            if (typeof cb == "function") {
                cb(false);
                logger.error("Error - " + error);
            }
        } else {
            if (typeof cb == "function") {
                cb(true);
            }
        }
    });

    //Close the connection
    pingConnection.close();


}