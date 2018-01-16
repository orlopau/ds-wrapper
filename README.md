# ds-wrapper for the Digitalstrom Server

A simple wrapper based on promises.

## Manages authentication and session tokens

The module can manage the task of retrieving and authenticating the *application token*, aswell as retrieving and refreshing the *session token*.

## Usage

### Import the module
```js
/* specify dss ip as parameter */
const ds = require('ds-wrapper')('192.168.188.4');
```

### Retrieving the application token

There is a fully automated process available, that enables the token by logging in the User.

**The Application Token must be stored, because it does not expire, once authenticated!**

```js
/* Authentication */
let app_token;
ds.initializeAuthentication('appName', 'username', 'password').then((token) => {
    console.log(token);
    /* store token somewhere */
}, (err) => {
    console.log(err);
});
```

The option to authenticate the token in the user interface is also available, although not recommended.

```js
retrieveApplicationToken('appName').then((appToken) => {
    console.log(appToken);
}, (err) => {
    console.log(err);
});
```

### Sending requests

To request an action that has to be authenticated by a session token ([refer to the docs...](http://developer.digitalstrom.org/Architecture/dss-json.pdf)) another function can be used.

```js
/* Performing actions */
const path = '/json/apartment/getName';

ds.requestWithSessionFromDSS(path, {test: true}, token).then((body) => {
    console.log(body);
}, (err) => {
    console.log(err);
});
```

### Functions

#### requestWithSessionFromDSS

Performs a request to the dss with automatic session management.

```js
/**
 * Requests from dss with session token
 * @param {string} path path to request
 * @param {Object} query params to query
 * @param {string} app_token Application token, that is activated
 * @returns {Promise} Promise: resolve(body) | reject(error)
 */
requestWithSessionFromDSS(path, query, app_token)
```

#### retrieveApplicationToken

```js
/**
 * Retrieves AppToken from dss.
 * @param {String} readableAppName Human readable app name
 * @returns {Promise} Promise: resolve(token) | reject(err)
 */
retrieveApplicationToken(readableAppName)
```

#### activateApplicationToken

```js
/**
 * Activates application token with credentials
 * @param {string} username dss username
 * @param {string} password dss password
 * @param {string} app_token application token
 * @returns {Promise} Promise: resolve() | reject(err)
 */
activateApplicationToken(username, password, app_token)
```

#### initializeAuthentication

```js
/**
 * Automatic authentication of application in the dss
 * @param {string} readableName - Name of the application
 * @param {string} username - dss username
 * @param {string} password - dss password
 * @returns {Promise} Promise: resolve(appToken) | reject(err)
 */
initializeAuthentication(readableName, username, password)
```
