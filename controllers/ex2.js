'use strict';

var PJAX = require('../services/PjaxEx2'),
  validator = require('../services/validation');

PJAX.qs.options = { array: 'x', obj: '[]' }; // query string format for Express

// CONSTANTS. These would likely be read from a DB in practice.
var regions = [
    ['r1', 'region1 name'],
    ['r2', 'region2 name'],
    ['r3', 'region3 name']
  ],

  clubs = {
    r1: [
      ['club0', 'club0 name'],
      ['club1', 'club1 name'],
      ['club2', 'club2 name'],
      ['club3', 'club3 name'],
      ['club4', 'club4 name']
    ],
    r2: [
      ['club4', 'club4 name'],
      ['club5', 'club5 name'],
      ['club6', 'club6 name'],
      ['club7', 'club7 name']
    ],
    r3: [
      ['club0', 'club0 name'],
      ['club2', 'club2 name'],
      ['club4', 'club4 name'],
      ['club6', 'club6 name']
    ]
  };

// ROUTE CONTROLLERS

module.exports = {

  index: function (req, res) {
    // Read comments in property 'club' before trying to understand 'index'.
    PJAX.logReqInfo('/ex2/index', req);

    res.locals.htmlToLoad = '/ex2/club' + PJAX.getQueryString(req);

    PJAX.logResInfo('ex2/htmlFramework', null, res);
    res.render('ex2/htmlFramework', {layout: false});
  },

  club: function (req, res) {
    PJAX.logReqInfo('/ex2/club', req);
    var err = false,
      clientUrl; // declaring here avoids hint msgs

    // Extract any detected client features into req.session_widths & _features.
    PJAX.extractDetectedClientFeatures(req, null);

    // get state. Its usually in req.query on GET, req.body on POST
    var state = {
      region: req.param('region') || '',
      input: req.param('input') || '',
      sex: req.param('sex') || '',

      // Arrays are not assigned default values
      club: req.param('club'),
      animal: req.param('animal')
    };

    // Coerce into arrays values that should be arrays,
    // e.g. <select multiple> or checkbox group returns a string when one value
    // is selected, and an array when more than one. We make them arrays always.
    PJAX.coercePropsToArray(state, 'club', 'animal');

    /**
     * handle POST =============================================================
     * Many comments after this 'if' are applicable here.
     */

    if (req.route.method === 'post') {
      console.log('\n<> POST validation. state=\n', state);

      // validate data
      err = validator.getMessagesFromServerModelValidation(state,
        'ex2/club', req, {});

      // handle valid form data ------------------------------------------------
      if (!err) {
        console.log('POST data is correct');

        clientUrl = PJAX.getUrlFromState('/ex2/team', {
          region: state.region,
          club: state.club
        });

        PJAX.logRedirectInfo(clientUrl, req);
        res.redirect(clientUrl);
        return;
      }
    }

    /**
     * handle GET or errors ====================================================
     */

    // * One common design for displaying server msgs is in a 'box' at the top
    // of the page. err.messages is an array suitable for this.
    // * Another design would display server msgs below the relevant DOM
    // tag. err.details[fieldName].message is suitable for this.
    // * The template may also use express-flash, although this micro-framework
    // does not make use it.
    res.locals.msgs = err ? err.messages : [];
    res.locals.fieldMsgs = err ? err.details : {};

    // template helper fcns
    extend(res.locals, PJAX.template);

    // pass state to template
    extend(res.locals, state);

    res.locals.regions = regions;
    res.locals.clubs = clubs;

    if (req.header('X-PJAX')) {
      // PJAX REQUEST FOR A HTML FRAGMENT

      // Pass frontend validation to template as .validations[fieldName]
      // .attrs = tag attributes e.g. pattern="^[a-zA-Z0-9]{3,15}$" required
      // .msg = error message e.g. '3 to 15 letters or numbers required.'
      res.locals.validations = validator.getClientModelValidation('ex2/club', null);

      // * Inserting HTML into the DOM is not the only thing jquery-pjax does.
      // * Users want to be able to save bookmarks and they expect to see a properly
      // rendered page when they use the bookmark.
      // * The server therefore should send the client a bookmark-able URL,
      // and it should be able to render a completely refreshed page when it gets
      // that URL at some later time.
      // FYI, such a request would not have a X-PJAX header.
      // * jquery-pjax will set the client's window.location.search to the URL
      // provided by the server after inserting a PJAX request HTML.
      clientUrl =  PJAX.getUrlFromState('/ex2/club',state);
      res.setHeader('X-PJAX-URL', clientUrl);

      // render the PJAX HTML
      PJAX.logResInfo('ex2/club', clientUrl, res);
      res.render('ex2/club', {layout: false});

    } else {
      // REQUEST IS FROM A BOOKMARK, ETC. RENDER A COMPLETE, REFRESHED PAGE.

      // * We'll render the html framework and cause it to PJAX the contents.
      // Redirecting with res.redirect('/ex2') would accomplish the same thing.
      // * We could instead have rendered a complete page, including the html
      // framework and PJAX fragment. This would result in a single round trip.
      res.locals.htmlToLoad = '/ex2/club' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex2/htmlFramework', null, res);
      res.render('ex2/htmlFramework', {layout: false});
    }
  },

  team: function (req, res) {
    PJAX.logReqInfo('/ex2/team', req);
    var err = false, clientUrl;

    PJAX.extractDetectedClientFeatures(req, null);

    var state = {
      region: req.param('region') || '',
      club: req.param('club'),
      teams: req.param('teams')
    };
    PJAX.coercePropsToArray(state, 'club', 'teams');

    /**
     * handle POST =============================================================
     */

    if (req.route.method === 'post') {
      console.log('\n<> POST validation. state=\n', state);

      err = validator.getMessagesFromServerModelValidation(state,
        'ex2/team', req, {});

      // handle valid form data ------------------------------------------------
      if (!err) {
        console.log('POST data is correct');
        clientUrl = PJAX.getUrlFromState('/ex2/schedule', state);

        PJAX.logRedirectInfo(clientUrl, req);
        res.redirect(clientUrl);
        return;
      }
    }

    /**
     * handle GET or errors ====================================================
     */

    var clubsInRegion = clubs[state.region] || [],
      str = '';
    state.club.forEach(function (club) {
      var name = _findName(clubsInRegion || [], club);
      if (name) { str += (str ? ', ' : '') + name; }
    });

    res.locals.regionName = _findName(regions, state.region);
    res.locals.clubName = str;

    res.locals.msgs = err ? err.messages : [];
    res.locals.fieldMsgs = err ? err.details : {};
    extend(res.locals, PJAX.template);
    extend(res.locals, state);

    if (req.header('X-PJAX')) {
      res.locals.validations = validator.getClientModelValidation('ex2/team', null);

      clientUrl =  PJAX.getUrlFromState('/ex2/team',state);
      res.setHeader('X-PJAX-URL', clientUrl);

      PJAX.logResInfo('ex2/team', clientUrl, res);
      res.render('ex2/team', {layout: false});

    } else {
      res.locals.htmlToLoad = '/ex2/team' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex2/htmlFramework', null, res);
      res.render('ex2/htmlFramework', {layout: false});
    }
  },

  schedule2: function (req, res) {
    PJAX.logReqInfo('/ex2/team', req);
    var err = false, clientUrl;

    PJAX.extractDetectedClientFeatures(req, null);

    var state = {
      region: req.param('region') || '',
      club: req.param('club'),
      teams: req.param('teams')
    };
    PJAX.coercePropsToArray(state, 'club', 'teams');

    /**
     * handle GET or errors ====================================================
     */

    var clubsInRegion = clubs[state.region] || [],
      str = '';
    state.club.forEach(function (club) {
      var name = _findName(clubsInRegion || [], club);
      if (name) { str += (str ? ', ' : '') + name; }
    });

    res.locals.regionName = _findName(regions, state.region);
    res.locals.clubName = str;
    res.locals.teamsNames = state.teams.join(', ');

    res.locals.msgs = err ? err.messages : [];
    res.locals.fieldMsgs = err ? err.details : {};
    extend(res.locals, PJAX.template);
    extend(res.locals, state);

    if (req.header('X-PJAX')) {
      res.locals.validations = validator.getClientModelValidation('ex2/schedule', null);

      clientUrl =  PJAX.getUrlFromState('/ex2/schedule',state);
      res.setHeader('X-PJAX-URL', clientUrl);

      PJAX.logResInfo('ex2/schedule', clientUrl, res);
      res.render('ex2/schedule', {layout: false});

    } else {
      res.locals.htmlToLoad = '/ex2/schedule' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex2/htmlFramework', null, res);
      res.render('ex2/htmlFramework', {layout: false});
    }
  },

  schedule: function (req, res) {
    PJAX.logReqInfo('/ex2/schedule', req);
    PJAX.extractDetectedClientFeatures(req, null);

    res.locals.regionName = _findName(regions, req.session.region);
    res.locals.clubName = _findName(clubs[req.session.region] || [], req.session.club);

    var teams = req.session.teams;
    res.locals.teamsNames = typeof teams === 'string' ? teams :
      req.session.teams.join(', ');

    if (req.header('X-PJAX')) {

      var clientUrl = PJAX.getUrlExpress(req, res, '/ex2/schedule', ['region', 'club', 'teams']);
      res.setHeader('X-PJAX-URL', clientUrl);

      PJAX.logResInfo('ex2/schedule', clientUrl, res);
      res.render('ex2/schedule', {layout: false});

    } else {

      res.locals.htmlToLoad = '/ex2/schedule' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex2/htmlFramework', null, res);
      res.render('ex2/htmlFramework', {layout: false});
    }
  },

  screen1: function (req, res) {
    PJAX.logReqInfo('/ex2/screen1', req);
    PJAX.extractDetectedClientFeatures(req, null);

    if (req.header('X-PJAX')) {

      var clientUrl = '/ex2/screen1';
      res.setHeader('X-PJAX-URL', clientUrl);

      PJAX.logResInfo('ex2/screen1', clientUrl, res);
      res.render('ex2/screen1', {layout: false});

    } else {

      res.locals.htmlToLoad = '/ex2/screen1' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex2/htmlFramework', null, res);
      res.render('ex2/htmlFramework', {layout: false});
    }
  }
};

function _findName (list, key) {
  for (var i = 0, len = list.length; i < len; i += 1) {
    if (list[i][0] === key) {
      return list[i][1];
    }
  }
  return '';
}

function extend (a, b) {
  for (var x in b) {
    if (b.hasOwnProperty(x)) { // suppress hint msg, not really needed
      a[x] = b[x];
    }
  }
}

// todo implement i18n in validation.js.
// todo cache rendered templates on server.
// - cache keyed by state URL+qs sent client
// - put _doNotCache=true& in qs if any msgs. so we don't cache ones with msgs.
// - tricky part: params when to invalidate cache on DB change.