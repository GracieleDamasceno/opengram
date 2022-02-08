const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.NODE_DOCKER_PORT || 8080;
const database = require("./configuration/connection.configuration.js");
const bodyParser = require('body-parser');

var corsConfig = {origin:"http://localhost:8080"};

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

database.mongoose
    .connect(database.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Connection with database was successful");
    })
    .catch(error => {
        console.log("Error while connecting to database: ", error);
        process.exit();
    });

app.get("/", (req, res) => {
    res.json({message:"OpenGram is ON!"})
});

require("./route/user.route.js")(app);
app.listen(PORT, () => {
    console.log('Server is up and running on port ' + PORT);
});