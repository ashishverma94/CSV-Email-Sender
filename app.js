const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(express.json());
app.use("/", express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.end("Hello test!");
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config();
}

// import routes 
const user = require("./controller/user.js");
const email = require("./controller/email.js");

app.use("/api/v1/user", user);  
app.use("/api/v1/email", email);


module.exports = app; 
