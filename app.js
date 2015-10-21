/*
 * Module dependencies
 */
var express = require('express');
var stylus = require('stylus');
var nib = require('nib');
var haml = require('hamljs');
var util = require('util');

var app = express();

function compile(str, path) {
return stylus(str)
  .set('filename', path)
  .use(nib())
}

app.set('views', __dirname + '/views');
// app.set('view engine', 'haml'); // sets default extension
app.engine('.haml', function(str, options, fn) {
  options.locals = util._extend({}, options)
    return haml.renderFile(str, 'utf-8', options, fn);
})
// var logger = require('morgan');
// app.use(logger); //replaces your app.use(express.logger());
app.use(stylus.middleware(
{ src: __dirname + '/public'
, compile: compile
}
))
app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
  // res.send('Fuck!');
  // res.send(haml.renderFile + 'hey');
    res.render(
        'layout.haml',
        { title : 'Home' }
    );
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});


