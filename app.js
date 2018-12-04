//app.js 

'use strict';

var dotenv = require('dotenv');
var SwaggerExpress = require('swagger-express-mw');
var bodyParser  = require('body-parser');
var fs = require('fs');
var jsYaml = require('js-yaml');
var app = require('express')();

var config = require('config');

dotenv.config({silent: true});

module.exports = app; // for testing

var applicationName = process.env.APPD_NAME;
var enableAppD = process.env.ENABLE_APPD;
if(enableAppD === 'true') {
    require("appdynamics").profile({
        debug: false,
        controllerHostName: 'cisco1.saas.appdynamics.com',
        controllerPort: 443,
        // If SSL, be sure to enable the next line
        controllerSslEnabled: true,
        accountName: 'cisco1',
        accountAccessKey: 'd3e5abdf5f60',
        applicationName: applicationName,
        tierName: 'EB-MicroService-AccessCache',
        nodeName: process.env.HOSTNAME // The controller will automatically append the node name with a unique number
    });
}


var swaggerTools  =require('swagger-tools');

//For inserting text data


var bodyParser  = require('body-parser');
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));
app.use(bodyParser.json({
    limit: '50mb',
    extended: true,
    verify: function(req, res, buf){
        try {
            JSON.parse(buf);
        } catch(e) {
            console.log("error");
            res.status(415).send({
                message:"Invalid JSON",
                error: 'BROKEN_JSON',
                timeStamp:new Date(),
                code:"EBF-APP-400-00",
                supportEmail:"support@ebapi.cisco.com",
                status:"warn"
            });

        }
    }
}));

var configuration = {
    appRoot: __dirname // required config
};

SwaggerExpress.create(configuration, function(err, swaggerExpress) {
    if (err) { throw err; }

    // install middleware
    swaggerExpress.register(app);

    //first get the environment variable then if that also
    //doesn't exist then default to 8080
    var port = process.env.PORT || 8080;

    app.listen(port);

    console.log('Server started at port %d', port);
});


var swaggerDoc = jsYaml.load(fs.readFileSync('./api/swagger/swagger.yaml'));
// Initialize the Swagger middleware for the api doc purpose
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
    // Serve the Swagger documents and Swagger UI
    var uiOptions = {
       // apiDocs: swaggerDoc.basePath +'/ts/spec',  // <-- override the default /api-docs
        swaggerUi : swaggerDoc.basePath + '/ts/api_docs'
    };
    app.use(middleware.swaggerUi(uiOptions));
});
module.exports = app;