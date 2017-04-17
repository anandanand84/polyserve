/**
 * @license
 * Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
'use strict';
var express = require('express');
var findPort = require('find-port');
var httpProxy = require('http-proxy');
var http = require('http');
var opn = require('opn');
var make_app_1 = require('./make_app');
var proxy = new httpProxy.RoutingProxy();
function apiProxy(host, port) {
    return function (req, res, next) {
        if (req.url.match(new RegExp('api|auth|screener|user|logout|session'))
            && (((req.url.indexOf('.html') === -1)
                && (req.url.indexOf('.js') === -1)
                && (req.url.indexOf('.css') === -1)
                && (req.url.indexOf('.png') === -1)) || req.url.indexOf('login-success.html') !== -1)) {
            proxy.proxyRequest(req, res, { host: host, port: port });
        }
        else {
            next();
        }
    };
}
/**
 * @return {Promise} A Promise that completes when the server has started.
 */
function startServer(options) {
    return new Promise(function (resolve, reject) {
        if (options.port) {
            resolve(options);
        }
        else {
            findPort(8080, 8180, function (ports) {
                options.port = ports[0];
                resolve(options);
            });
        }
    }).then(function (opts) { return startWithPort(opts); });
}
var portInUseMessage = function (port) { return ("\nERROR: Port in use: " + port + "\nPlease choose another port, or let an unused port be chosen automatically.\n"); };
/**
 * @param {Object} options
 * @param {Number} options.port -- port number
 * @param {String} options.host -- hostname string
 * @param {String=} options.page -- page path, ex: "/", "/index.html"
 * @param {(String|String[])} options.browser -- names of browser apps to launch
 * @return {Promise}
 */
function startWithPort(options) {
    options.port = options.port || 8080;
    options.host = options.host || "localhost";
    console.log('Starting Polyserve on port ' + options.port);
    var app = express();
    var polyserve = make_app_1.makeApp({
        componentDir: options.componentDir,
        packageName: options.packageName,
        root: process.cwd()
    });
    app.use(apiProxy('localhost', 8421));
    app.get('/', function (req, res) {
        res.redirect(301, "/components/" + polyserve.packageName + "/");
    });
    app.use('/components/', polyserve);
    var server = http.createServer(app);
    var serverStartedResolve;
    var serverStartedReject;
    var serverStartedPromise = new Promise(function (resolve, reject) {
        serverStartedResolve = resolve;
        serverStartedReject = reject;
    });
    server = app.listen(options.port, options.host, function () { return serverStartedResolve(server); });
    server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            console.error(portInUseMessage(options.port));
        }
        serverStartedReject(err);
    });
    var baseUrl = "http://" + options.host + ":" + options.port + "/components/" + polyserve.packageName + "/";
    console.log("Files in this directory are available under " + baseUrl);
    if (options.page) {
        var url = baseUrl + (options.page === true ? 'index.html' : options.page);
        if (Array.isArray(options.browser)) {
            for (var i = 0; i < options.browser.length; i++)
                opn(url, options.browser[i]);
        }
        else {
            opn(url, options.browser);
        }
    }
    return serverStartedPromise;
}
module.exports = startServer;
//# sourceMappingURL=start_server.js.map