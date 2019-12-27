'use strict';

const http = require('http');
const https = require('https');
const request = require('request');
const log = require('loglevel');
const fs = require('fs');

log.setLevel(0);

module.exports = function(ds_ip, log_level) {
    if(ds_ip === null || ds_ip === undefined){
        throw "No DSS IP specified in constructor!";
    }
    if (log_level) {
        log.setLevel(log_level);
    }

    let module = {};

    /**
     * Sends a GET request to the dss.
     * @param {string} path
     * @param {Object} query
     * @returns {Promise} Promise: resolve(json) | reject(err, statusCode)
     */
    function requestFromDSS(path, query) {
        return new Promise((resolve, reject) => {
            const agent_options = {
                rejectUnauthorized: false,
            };
            const agent = new https.Agent(agent_options);
            const options = {
                url: 'https://' + ds_ip + ':8080' + path,
                protocol: 'https:',
                qs: query,
                json: true,
                agent: agent,
            };

            request(options, (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    resolve(body);
                }
                else {
                    reject(
                        {
                            error: err,
                            status_code: res.statusCode,
                        });
                }
            });
        });
    }

    let last_access = 0;
    const session_timeout = 50 * 1000;

    let session_token;

    /**
     * Requests from dss with session token
     * @param {string} path path to request
     * @param {Object} query params to query
     * @param {string} app_token Application token, that is activated
     * @returns {Promise} Promise: resolve(body) | reject(error)
     */
    function requestWithSessionFromDSS(path, query, app_token) {
        return new Promise((resolve, reject) => {
            /* check if session is still valid */
            if ((last_access + session_timeout) <= Date.now() || session_token === null) {
                /* renew session token */
                const login_path = '/json/system/loginApplication';
                const login_query = {
                    loginToken: app_token,
                };

                /**
                 * Request new sess token
                 */
                log.debug('requesting new session token...');
                requestFromDSS(login_path, login_query).then((body) => {
                    if (body.ok === true) {
                        session_token = body.result.token;
                        last_access = Date.now();

                        log.debug('obtained session token: ' + session_token);
                        /* proceed with request */
                        requestWithSessionFromDSS(path, query, app_token).then((body) => {
                            resolve(body);
                        }, (err) => {
                            reject('error while requesting ' + path + " :" + JSON.stringify(err));
                        });
                    }
                    else {
                        reject('failed to obtain sess token ' + body.message);
                    }
                }, (err) => {
                    reject('failed to obtain sess token ' + err);
                });

            }
            else {
                log.debug('requesting without refreshing token');

                query.token = session_token;

                requestFromDSS(path, query).then((body) => {
                    last_access = Date.now();
                    resolve(body);
                }, (err) => {
                    reject(err);
                });
            }
        });
    }

    module.requestWithSessionFromDSS = requestWithSessionFromDSS;

    /**
     * Retrieves AppToken from dss.
     * @param {String} readableAppName Human readable app name
     * @returns {Promise} Promise: resolve(token) | reject(err)
     */
    function retrieveApplicationToken(readableAppName) {
        return new Promise((resolve, reject) => {
            const path = '/json/system/requestApplicationToken';
            const query = {
                applicationName: readableAppName,
            };

            requestFromDSS(path, query).then((body) => {
                let token = body.result.applicationToken;
                resolve(
                    token);
            }, (err) => {
                reject('AppToken no valid response: ' + err.error + ' status: ' + err.status_code);
            });
        });
    }

    module.retrieveApplicationToken = retrieveApplicationToken;

    /**
     * Activates application token with credentials
     * @param {string} username dss username
     * @param {string} password dss password
     * @param {string} app_token application token
     * @returns {Promise} Promise: resolve() | reject(err)
     */
    function activateApplicationToken(username, password, app_token) {
        return new Promise((resolve, reject) => {

            /* login to dss to obtain session token */
            const path = '/json/system/login';
            const query = {
                user: username,
                password: password,
            };
            requestFromDSS(path, query).then((body) => {
                if (body.ok === true) {

                    /* activate application token with session token*/
                    const path = '/json/system/enableToken';
                    const query = {
                        applicationToken: app_token,
                        token: body.result.token,
                    };
                    requestFromDSS(path, query).then((body) => {
                        if (body.ok === true) {
                            resolve();
                        }
                        else {
                            reject('Unknown error while activating the token.');
                        }
                    }, (err) => {
                        reject(err);
                    });

                }
                else {
                    reject('Wrong login data!');
                }
            }, (err) => {
                reject(err);
            });
        });
    }

    module.activateApplicationToken = activateApplicationToken;

    /**
     * Automatic authentication of application in the dss
     * @param {string} readableName - Name of the application
     * @param {string} username - dss username
     * @param {string} password - dss password
     * @returns {Promise} Promise: resolve(appToken) | reject(err)
     */
    function initializeAuthentication(readableName, username, password) {
        return new Promise((resolve, reject) => {
            retrieveApplicationToken(readableName).then((appToken) => {
                log.debug('Retrieved AppToken ' + appToken);
                activateApplicationToken(username, password, appToken).then(() => {
                    log.debug('Successful authentification.');
                    resolve(appToken);
                }, (err) => {
                    log.debug('Error while activating token ' + err);
                    reject(err);
                });
            }, (err) => {
                reject(err);
            });
        });
    }

    module.initializeAuthentication = initializeAuthentication;

    return module;
};





