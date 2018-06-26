const express = require('express');
const app = express();

app.get('/', function(req, res) {
    res.send('home');
});

app.get('/profile/:username', function (req, res) {
    res.send(`hi ${req.params.username}`);
});

app.listen(3000);