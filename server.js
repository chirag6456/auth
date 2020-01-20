const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const users = require("./routes/api/users");
const app = express();
// Bodyparser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose.connect(db,{ useNewUrlParser: true, useUnifiedTopology : true }).then(() => console.log("Connected to Database.")).catch(err => console.log(err));

app.use("/api/users", users);
const port = process.env.PORT || 3000; 
app.listen(port, () => console.log(`Server running on port ${port} !`));