const express = require("express");
const app = express();
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("db.json");
const db = low(adapter);
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

app.use(cookieParser());
app.use(bodyParser.json({extended: true}));

db.defaults({books: [], users: []})
    .write();

const auth = require("./app/user_logic.js")(app, db);
// const businessLogic = require('./app/business_logic.js')(app, db, auth);
require("./app/business_logic.js")(app, db, auth);

app.use(express.static("public"));
app.get("*", function(req, res) {
  res.sendfile("./public/");
});

app.listen(80, function() {
  console.log("Server listening on port 80!");
});
