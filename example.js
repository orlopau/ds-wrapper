const ds = require('./index.js')('192.168.188.4');

/* Authentication */
ds.initializeAuthentication('appName', 'dssadmin', 'dssadmin').then((token) => {
    console.log(token);
    /* store token somewhere */

    /* Performing actions */
    const path = '/json/apartment/getName';

    ds.requestWithSessionFromDSS(path, {test: true}, token).then((body) => {
        console.log(body);
    }, (err) => {
        console.log(err);
    });
}, (err) => {
    console.log(err);
});

