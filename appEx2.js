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

var COUNT = 0; // global
app.use(function (req, res, next) {
  console.log('\n////////// request# ', ++COUNT , ' method=', req.method,
    'url=', req.url);
  next();
});

if (secrets.useCrsfProtection) {
  // ENABLE CSRF PROTECTION

  // Some info on CSRF in Express:
  // http://stackoverflow.com/questions/13516898/disable-csrf-validation-for-some-requests-on-express
  // http://stackoverflow.com/questions/21645504/why-does-express-connect-generate-new-csrf-token-on-each-request
  // http://stackoverflow.com/questions/19505681/how-to-implement-csrf-protection-for-get-requests-in-express
  app.use(function (req, res, next) {
    var currCsrf = (req.body && req.body._csrf)
      || (req.query && req.query._csrf)
      || (req.headers['x-csrf-token'])
      || (req.headers['x-xsrf-token']);
    //console.log('last csrf token issued =', req.session && req.session.lastCsrf);
    //console.log('csrf token this request=', currCsrf);
    next();
  });

  // This doesn't check for a valid token if method === GET || HEAD || OPTION.
  // It doesn't check for equality of tokens, in part because the Back button
  // would be problematic.
  // It extracts the 'seed' of the req token and recreates what token it would
  // have issued for that seed (using the site's "secret"). The req token must
  // equal the recreated one. This allows the user to click Back multiple times
  // and reissue a request. Nice.
  app.use(express.csrf());

  // Generate a new csrf token for every request and make it available for
  // the template.
  app.use(function(req, res, next) {
    res.locals.user = req.user;
    res.locals._csrf = req.csrfToken();
    res.locals.secrets = secrets;
    next();
  });

  app.use(function(req, res, next) {
    if (req.session) { req.session.lastCsrf = res.locals._csrf; }
    //console.log('new csrf token created =', res.locals._csrf);
    next();
  });
} else {

  // PREVENT THINGS DESIGNED FOR CSRF PROTECTION FROM FAILING WHEN ITS OFF
  app.use(function(req, res, next) {
    res.locals.user = '';
    res.locals._csrf = '';
    res.locals.secrets = {};
    next();
  });
}

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
app.post('/ex2/club', ex2Controller.club);
app.get ('/ex2/team', ex2Controller.team);
app.post('/ex2/team', ex2Controller.team);
app.get ('/ex2/schedule', ex2Controller.schedule2);
app.get ('/ex2/screen1', ex2Controller.screen1);

/**
 * Parse form validations
 */

require('./services/validation');

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log("✔ Express server listening on port %d in %s mode", app.get('port'), app.get('env'));
});

module.exports = app;
