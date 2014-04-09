'use strict';

var PJAX = require('../services/PjaxEx1');
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
    PJAX.logReqInfo('/ex1/index', req);

    req.session.X_PJAX = null;
    res.locals.htmlToLoad = '/ex1/club' + PJAX.getQueryString(req);

    PJAX.logResInfo('ex1/htmlFramework', null, res);
    res.render('ex1/htmlFramework', {layout: false});
  },

  club: function (req, res) {
    PJAX.logReqInfo('/ex1/club', req);

    // Extract any detected client features into req.session_widths & _features.
    PJAX.extractDetectedClientFeatures(req, null);

    var region = res.locals.region = req.query.region || '';
    var club = res.locals.club = req.query.club || '';

    res.locals.regions = regions;
    res.locals.clubs = clubs;

    // * A route directly called by a client jquery-pjax request will have a
    // X-PJAX header.
    // * The route may be for a PJAX POST request. If the POST data is
    // validated correctly, the route is likely to res.redirect(..) to
    // another route to render a response. That redirected-to route will not
    // have a X-PJAX header. todo (Ooops, it may have the header. Check)
    // * We req.session.X_PJAX = true before redirection, so the
    // redirected-to route knows the original client request was PJAX.
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    if (req.session.X_PJAX) {
      // PJAX REQUEST FOR A HTML FRAGMENT

      // * Inserting HTML into the DOM is not the only thing jquery-pjax does.
      // * Users want to be able to save bookmarks and they expect to see a properly
      // rendered page when they use the bookmark.
      // * The server therefore should send the client a bookmark-able URL,
      // and it should be able to render a completely refreshed page when it gets
      // that URL at some later time.
      // FYI, such a request would not have a X-PJAX header.
      // * jquery-pjax will set the client's window.location.search to the URL
      // provided by the server after inserting a PJAX request HTML.
      var clientUrl =  PJAX.getUrlExpress(req, res, '/ex1/club', ['region', 'club']);
      res.setHeader('X-PJAX-URL', clientUrl);

      // We are not redirecting
      req.session.X_PJAX = null;

      // render the PJAX HTML
      PJAX.logResInfo('ex1/club', clientUrl, res);
      res.render('ex1/club', {layout: false});

    } else {
      // REQUEST IS FROM A BOOKMARK, ETC. RENDER A COMPLETE, REFRESHED PAGE.

      // * We'll render the html framework and cause it to PJAX the contents.
      // Redirecting with res.redirect('/ex1') would accomplish the same thing.
      // * We could instead have rendered a complete page, including the html
      // framework and PJAX fragment. This would result in a single round trip.
      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/club' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }
  },

  clubPost: function (req, res) {

    // jQuery returns a string if one choice is selected for
    // <select multiple> and <input type="checkbox"> tags, and it returns an
    // array if multiple choices are selected. We will only see this in
    // req.body (not req.query) but its annoying.
    // Here, we coerce such values to arrays if they exist, and to [] if
    // they don't. Thereafter our code can assume they are always arrays.
    PJAX.coercePropToArray(req.body, 'club');
    PJAX.coercePropToArray(req.body, 'animal');

    PJAX.logReqInfo('/ex1/clubPost', req);
    PJAX.extractDetectedClientFeatures(req, null);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    req.session.region = req.body.region;
    req.session.club = req.body.club;

    var clientUrl = PJAX.getUrlExpress(req, res, '/ex1/team', ['region', 'club']);
    PJAX.logRedirectInfo(clientUrl, req);
    res.redirect(clientUrl);
  },

  team: function (req, res) {
    PJAX.logReqInfo('/ex1/team', req);
    PJAX.extractDetectedClientFeatures(req, null);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    res.locals.regionName = _findName(regions, req.session.region);
    res.locals.clubName = _findName(clubs[req.session.region] || [], req.session.club);

    if (req.session.X_PJAX) {

      var clientUrl = PJAX.getUrlExpress(req, res, '/ex1/team', ['region', 'club', 'teams']);
      res.setHeader('X-PJAX-URL', clientUrl);

      req.session.X_PJAX = null;
      PJAX.logResInfo('ex1/team', clientUrl, res);
      res.render('ex1/team', {layout: false});

    } else {

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/team' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }
  },


  teamPost: function (req, res) {
    PJAX.coercePropToArray(req.body, 'teams');

    PJAX.logReqInfo('/ex1/teamPost', req);
    PJAX.extractDetectedClientFeatures(req, null);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    req.session.teams = req.body.teams;

    var clientUrl = PJAX.getUrlExpress(req, res, '/ex1/schedule', ['region', 'club', 'teams']);
    PJAX.logRedirectInfo(clientUrl, req);
    res.redirect(clientUrl)
  },

  schedule: function (req, res) {
    PJAX.logReqInfo('/ex1/schedule', req);
    PJAX.extractDetectedClientFeatures(req, null);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    res.locals.regionName = _findName(regions, req.session.region);
    res.locals.clubName = _findName(clubs[req.session.region] || [], req.session.club);

    var teams = req.session.teams;
    res.locals.teamsNames = typeof teams === 'string' ? teams :
      req.session.teams.join(', ');

    if (req.session.X_PJAX) {

      var clientUrl = PJAX.getUrlExpress(req, res, '/ex1/schedule', ['region', 'club', 'teams']);
      res.setHeader('X-PJAX-URL', clientUrl);

      req.session.X_PJAX = null;
      PJAX.logResInfo('ex1/schedule', clientUrl, res);
      res.render('ex1/schedule', {layout: false});

    } else {

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/schedule' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
    }
  },

  screen1: function (req, res) {
    PJAX.logReqInfo('/ex1/screen1', req);
    PJAX.extractDetectedClientFeatures(req, null);
    req.session.X_PJAX = req.session.X_PJAX || req.header('X-PJAX');

    if (req.session.X_PJAX) {

      var clientUrl = '/ex1/screen1';
      res.setHeader('X-PJAX-URL', clientUrl);

      req.session.X_PJAX = null;
      PJAX.logResInfo('ex1/screen1', clientUrl, res);
      res.render('ex1/screen1', {layout: false});

    } else {

      req.session.X_PJAX = null;
      res.locals.htmlToLoad = '/ex1/screen1' + PJAX.getQueryString(req);

      PJAX.logResInfo('ex1/htmlFramework', null, res);
      res.render('ex1/htmlFramework', {layout: false});
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