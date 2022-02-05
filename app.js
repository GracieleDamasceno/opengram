const express = require('express');
const bodyParser = require('body-parser');
const user = require('./route/user.route'); 
const app = express();

app.use('/users', user);

let port = 1234;app.listen(port, () => {
    console.log('Server is up and running on port numner ' + port);
});