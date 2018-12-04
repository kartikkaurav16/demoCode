/**
 * Created by svishnub on 4/1/2016.
 */

var log = require('./newLogger');
var dotenv = require('dotenv');
var elasticsearch = require('elasticsearch');
var deleteByQuery = require('elasticsearch-deletebyquery');
const http = require('http');

var client = null;

// console.log("dotenv.config({ silent: process.env.NODE_ENV === 'production' }) "+ JSON.stringify(dotenv.config({ silent: process.env.NODE_ENV === 'production'}, undefined,4)))
console.log(process.env[process.env.ES_SVC_NAME + '_SERVICE_HOST'])
console.log("  ==> " + process.env[process.env.ES_SVC_NAME + '_SERVICE_HOST']+ ':' + process.env[process.env.ES_SVC_NAME + '_SERVICE_PORT'])

function getClient(){
    dotenv.config({ silent: process.env.NODE_ENV === 'production' });
    var prefix = process.env.ES_SVC_NAME;
    client = new elasticsearch.Client({
        host: process.env[prefix + '_SERVICE_HOST'] + ':' + process.env[prefix + '_SERVICE_PORT'],
        log: 'info',
        method: "GET"
    });
    return client;
}

function getPOSTClient(){
    dotenv.config({ silent: process.env.NODE_ENV === 'production' });
    var prefix = process.env.ES_SVC_NAME;
    return new elasticsearch.Client({
        host: process.env[prefix + '_SERVICE_HOST'] + ':' + process.env[prefix + '_SERVICE_POST_PORT'],
        log: 'info',
        plugins: [ deleteByQuery ]
    });
}

/*Make HTTP call*/
const httpClient = function(postBody, cb) {
    const prefix = process.env.ES_SVC_NAME;
    let options = {
        hostname: process.env[prefix + '_SERVICE_HOST'],
        method: 'POST',
        port: process.env[prefix + '_SERVICE_PORT'],
        path: '/'+postBody.index+'/'+postBody.type+'/'+postBody.method
    };

    let req = http.request(options, function(res) {
        let rawdata = '';
        res.on('data', function(chunk) {
            rawdata += chunk;
        });
        let parsedData;
        res.on('end', function() {
            try {
                parsedData = JSON.parse(rawdata);
                cb(null, parsedData);

            } catch(exception) {
                cb({ 'error': 'elasticsearch gave error: '+JSON.stringify(exception) }, parsedData);
            }
        }).on('error', function (e) {
            cb({ 'error': 'elasticsearch gave error: '+JSON.stringify(e) }, parsedData);
        });
    });

    req.write(JSON.stringify(postBody.body));
    req.end();
};

module.exports = {
    // setup: setup,
    getClient : getClient,
    getPOSTClient : getPOSTClient,
    getHttpClient: httpClient
};
