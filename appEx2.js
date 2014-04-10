/**
 * Module dependencies.
 */

var express = require('express');
//var MongoStore = require('connect-mongo')(express);
var flash = require('express-flash');
var path = require('path');
//var mongoose = require('mongoose');
//var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

/**
 * Load controllers.
 */

var ex2Controller = require('./controllers/ex2');

/**
 * API keys + Passport configuration.
 */

var secrets = require('./config/secrets');
//var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Express configuration.
 */

var hour = 3600000;
var day = (hour * 24);
var month = (day * 30);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));


//app.set('view engine', 'jade');
app.set('view engine', 'ejs');

app.use(connectAssets({
  paths: ['public/css', 'public/js'],
  helperContext: app.locals
}));
app.use(express.compress());
app.use(express.logger('dev'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(expressValidator());
app.use(express.methodOverride());

app.use(express.session({
  secret: secrets.sessionSecret,
  cookie: { maxAge: 60000 }
  /* we're not using any DB
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  })
  */
}));



// http://stackoverflow.com/questions/13516898/disable-csrf-validation-for-some-requests-on-express
// http://stackoverflow.com/questions/21645504/why-does-express-connect-generate-new-csrf-token-on-each-request
// http://stackoverflow.com/questions/19505681/how-to-implement-csrf-protection-for-get-requests-in-express
// This doesn't check for a valid csrf token if method === GET || HEAD || OPTION
app.use(function(req, res, next) {
  if (req.method !=='GET' && req.method !== 'HEAD' && req.method !== 'OPTION') {
    console.log('/////////////////////////  req.url=', req.url);
    console.log('req.body._csrf=', req.body._csrf,
      'res.session.currentCsrf=', res.session ? res.session.currentCsrf : '*undefined');
  }
  next();
});
app.use(express.csrf());

// Tis generates a new csrf token for every non-static request

var COUNT = 0;
app.use(function(req, res, next) {
  res.locals.user = req.user;
  res.locals._csrf = req.csrfToken();
  res.locals.secrets = secrets;
  console.log('//////// COUNT=', COUNT++, 'reg.method=', req.method, 'req.body=', req.body);
  console.log('++++ gen new csrf. user=', req.user, '_csrf=', res.locals._csrf, 'secrets=', secrets);
  if (req.session) req.session.currentCsrf = res.locals._csrf;
  next();
});
// end of code =================================================================


app.use(flash());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: month }));


app.use(function(req, res, next) {
  // Keep track of previous URL
  if (req.method !== 'GET') return next();
  var path = req.path.split('/')[1];
  if (/(auth|login|logout|signup)$/i.test(path)) return next();
  req.session.returnTo = req.path;
  next();
});
app.use(app.router);
app.use(function(req, res) {
  res.status(404);
  res.render('404');
});
app.use(express.errorHandler());

/**
 * Application routes.
 */

app.get ('/', ex2Controller.index);

app.get ('/ex2', ex2Controller.index);
app.get ('/ex2/club', ex2Controller.club);
app.post('/ex2/club', ex2Controller.clubPost);
app.get ('/ex2/team', ex2Controller.team);
app.post('/ex2/team', ex2Controller.teamPost);
app.get ('/ex2/schedule', ex2Controller.schedule);
app.get ('/ex2/screen1', ex2Controller.screen1);


/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
