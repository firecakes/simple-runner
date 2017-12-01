require('dotenv').config()

const express = require('express');
const app = express();

app.use(express.static('.'))

app.listen(process.env.PORT || 80, function () {
    console.log("Server started");
});
