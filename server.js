const express = require('express');
const bodyParser = require('body-parser');
const user = require('./route/user.route'); 
const dotEnv = require("dotenv").config();
const app = express();
const PORT = process.env.NODE_DOCKER_PORT || 8080;

app.use('/users', user);
app.listen(PORT, () => {
    console.log('Server is up and running on port ' + PORT);
});