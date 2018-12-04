/*eslint no-unused-vars: [2, {"args": "after-used", "argsIgnorePattern": "^encoding$"}]*/
'use strict';
var config = require('config');
var winston = require('winston');
var dotenv = require('dotenv');
dotenv.config({ silent: false });


// winston.transports.Kafka = require('./winstonKafka');
//
// var object = {
//     topic: process.env.CLIP_TOPIC,
//     connectionString: process.env.CLIP_CONNECTION_STRING,
//     brokers : process.env.CLIP_CONNECTION_BROKER,
//     clientId : config.get('application_id'),
//     meta : {hostname: process.env.HOSTNAME}
// };
//
// winston.add(winston.transports.Kafka, object);
winston.emitErrs = true;

var fs = require('fs');
var dir = './logFiles';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}
var fileName = './logFiles/' + config.get('logging.file.name') + '.log';


//end of date based file names
var transports = [
    new winston.transports.File({
        level: process.env.LOG_LEVEL == null ? 'debug' : process.env.LOG_LEVEL,
        filename: fileName,
        handleExceptions: true,
        json: true,
        maxsize: 10242880, //5MB
        maxFiles: 1,
        colorize: false
    })
];

var logger = new (winston.Logger)({
    transports: transports,
    exitOnError: false
});


module.exports = {
    setLogger : setLoggingParams,
    getLogger : getLoggingParams,
    clearParameters : clearParameters,
    info : logInfo,
    error : logError,
    fail  :logFail,
    warn : logFail,
    debug : logDebug,
    profile_start : logProfile,
    profile_end : logProfile,
    getDate: getDate,
    log: DBLOG,
    formatDate  :formatAMPM,
    stream :  function write(message, encoding) {
        logger.info(message);
    }

}

var TRACKING_ID = null,
    API_TRACKING_ID = null,
    BREAD_CRUMB = [],
    CLIENT_ID = null,
    REQUEST_APPLICATION_ID = null,
    APPLICATION_ID = config.get('application_id');



function setLoggingParams(tracking_id, api_tracking_id, bread_crumb, client_id, request_application_id){


//if the tracking id is missing then leverage the api_tracking _id
//it is the developers responsibility to get these parameters from the header as these will
//arrive from the mule soft request

    //Also many calls are made internally via kubernetes hence the check on the API tracking ID.
    if(tracking_id == null || tracking_id == undefined || tracking_id == ''){
        TRACKING_ID = api_tracking_id ? api_tracking_id : "internalCall";
        API_TRACKING_ID = api_tracking_id ? api_tracking_id : "internalCall";
    }else{
        TRACKING_ID = tracking_id;
        API_TRACKING_ID = api_tracking_id ? api_tracking_id : "internalCall";
    }

    if(bread_crumb){
        BREAD_CRUMB =  bread_crumb.split(',');
    }

    if(APPLICATION_ID != undefined){
        //  BREAD_CRUMB += ',' + APPLICATION_ID;
        var exist = false;

        if(BREAD_CRUMB.length == 0){
            BREAD_CRUMB.push(APPLICATION_ID);
        }
        for(var i =0 ; i < BREAD_CRUMB.length ; i++){
            if(APPLICATION_ID == BREAD_CRUMB[i]){
                exist = true;
            }
        }
        if(!exist){
            BREAD_CRUMB.push(APPLICATION_ID);
        }
    }
    CLIENT_ID = client_id;
    REQUEST_APPLICATION_ID = request_application_id;

}

function getLoggingParams(){

    return {
        "time_stamp" : new Date().toISOString(),
        "application_type" : "API",
        "level" : null,
        "message" : null,
        "tracking_id" : TRACKING_ID,
        "api_tracking_id" : API_TRACKING_ID,
        "bread_crumb" : BREAD_CRUMB,
        "client_id" : CLIENT_ID,
        "request_application_id" : REQUEST_APPLICATION_ID,
        "application_id" : APPLICATION_ID,
        "cisco_life" : process.env['NODE_ENV'],
        "host_name" : process.env['HOSTNAME'],
        "flexAttr1" : null,
        "flexAttr2" : null,
        "flexAttr3" : null,
        "flexAttr4" : null
    }
}

function logInfo(message){

    var logObject = getLoggingParams();
    logObject.message = message;
    if (process.env.NODE_ENV === 'development') {
        logger.info(message);
        winston.log('info',message);
    }else{
        logger.info(logObject);
        winston.log('info',logObject);
    }


}

function logError(message){
    var logObject = getLoggingParams();
    logObject.message = message;
    if (process.env.NODE_ENV === 'development') {
        logger.error(message);
        winston.log('error',message);
    }else{
        logger.error(logObject);
        winston.log('error',logObject);
    }

}

function logFail(message){
    var logObject = getLoggingParams();
    logObject.message = message;
    if (process.env.NODE_ENV === 'development') {
        logger.warn(message);
        winston.log('warn',message);
    }else{
        logger.warn(logObject);
        winston.log('warn',logObject);
    }
}

function logDebug(message){
    var logObject = getLoggingParams();
    logObject.message = message;
    if (process.env.NODE_ENV === 'development') {
        logger.debug(message);
        winston.log('debug',message);
    }else{
        logger.debug(logObject);
        winston.log('debug',logObject);
    }

}

function logThis(level, message_object){
    winston.log(level, message_object);
}

function logProfile(actionName) {
    logger.profile(actionName);
}

function DBLOG(level, messageString){
    winston.log(level, messageString);
}



function getDate() {
    var now = new Date();
    var nowUtc = new Date(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    );
    return nowUtc;
}


function formatAMPM(date) {
    if(date == null || date =="null") {
        return null;
    }else{
        date = new Date(date);

        var hours = date.getHours();
        var minutes = date.getMinutes();
        var sec = date.getSeconds();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0'+minutes : minutes;
        var strTime = date.toLocaleDateString("en-US") +' ' +hours + ':' + minutes+ ':' + sec + ' ' + ampm;
        return strTime;
    }
}

function  clearParameters() {
    BREAD_CRUMB=[];
}