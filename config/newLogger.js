/*eslint no-unused-vars: [2, {"args": "after-used", "argsIgnorePattern": "^encoding$"}]*/
'use strict';
const config = require('config');
const winston = require('winston');
const dotenv = require('dotenv');
dotenv.config({ silent: false });

const LOG_LEVEL = process.env.LOG_LEVEL;

const LOG_FORMATTER = process.env.LOG_FORMATTER == 'false' ? false : true;
const APPLICATION_ID = config.get('application_id');
const LOG_PATH = process.env.LOG_PATH ? process.env.LOG_PATH : './logFiles/app_log.log';


winston.emitErrs = true;
const fs = require('fs');
const dir = LOG_PATH.replace('app_log.log','');

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

var transports = [
    new winston.transports.Console({
        level: process.env.LOG_LEVEL == null ? 'debug' : process.env.LOG_LEVEL,
        handleExceptions: true,
        json: false,
        colorize: true
    }),
    new (winston.transports.File)({
        filename: LOG_PATH, // this path needs to be absolute
        json: false,
        maxsize: 2000000, //20 Mb
        maxFiles: 2,
        formatter : formatter,
        tailable: true
    })
];



var logger = new winston.Logger({
    transports: transports,
    exitOnError: false
});

const tsFormat = () => (new Date()).toISOString().replace('Z', ' ').replace('T', ' ');
function formatter(options){
    if(!options.meta.message){
        options.meta.message = options.message;
    }
    return  !LOG_FORMATTER ?
        (options.message ? options.message +' - '+ JSON.stringify(options.meta) : JSON.stringify(options.meta) )
        :
        '[INFO ] '+tsFormat() +'['+ options.meta.host_name +']'+ ' ' +APPLICATION_ID + ' ' +
        (options.meta.tracking_id ? options.meta.tracking_id : '-' )
        +' - '+'{"api_message" : ' + JSON.stringify(options.meta)+'}'
       // (options.message ? '{"api_message" : {'+options.message.replace(':','-')+'} }' : '{"api_message" : ' + JSON.stringify(options.meta)+'}')
            ;
}
module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};
