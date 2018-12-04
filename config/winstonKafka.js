/**
 * Created by vdoddiha on 1/19/2018.
 */
/**
 * Created by vdoddiha on 6/27/2016.
 */

"use strict";

var util = require('util'),
    winston = require('winston'),
    _ = require('lodash'),
    kafka = require('kafka-node');

var Producer = kafka.HighLevelProducer,
    client,
    producer;

var _isConnected = false;

var KafkaLogger = function (options) {
    this.name = options.name || 'KafkaLogger';
    this.level = options.level || 'info';
    this.meta = options.meta || {};
    this.colorize = options.colorize || true;

    /*
     KAFKA Options
     */
    // Zookeeper connection string, default localhost:2181/kafka0.8
    this.connectionString = options.connectionString || 'localhost:2181';

    // This is a user supplied identifier for the client application, default kafka-node-client
    this.clientId = options.clientId;

    // Object, Zookeeper options, see node-zookeeper-client
    this.zkOptions = options.zkOptions;

    this.topic = options.topic;


    // Connect
    client = new kafka.Client(this.connectionString, this.clientId, this.zkOptions);
    client.brokerMetadata = options.brokers;

    //  client.loadMetadataForTopics(['clip-ebf-logs']);
    producer = new Producer(client);


    // console.log(JSON.stringify(client, undefined, 2));





    producer.on('ready', function () {
        console.log('ready---------->>>>');
        _isConnected = true;
    });

    producer.on('error', function (err) {
        _isConnected = false;
        var msg = 'winston-kafka-logger - Cannot connect to kafka server';
        // throw new Error(msg);
        console.error(msg, err);
    });
};

util.inherits(KafkaLogger, winston.Transport);

KafkaLogger.prototype.log = function (level, msg, meta, callback) {


    if (_isConnected) {

        meta.level = level;
        console.log("MESSAGE being sent : ----->>>");
        var messageString = "";
        for(var key in meta){
            if(meta[key] != null){
                messageString += '"'+key+'"'+'='+'"'+meta[key]+'"'+' ';
            }else{
                messageString += '"'+key+'"'+'='+'"-"'+' ';
                meta[key] = '-';
            }

        }

        //console.log(messageString);

        var payloads = [
            { topic: this.topic, messages: [messageString] }
        ];

        try {
            producer.send(payloads, function() {
                // Ignore
            });
        }
        catch(err) {
            console.error('Failed to send log to kafka!!');
        }
    }

    callback(null, true);
};

module.exports = KafkaLogger;