/* jshint jquery, strict: true */
/* global $, PJAX */
'use strict';

PJAX.qs.options = { array: 'x', obj: '[]' }; // query string format for Express

/**
 * Handlers for pjax loading/unloading.
 * @param {string} action is load or unload.
 *      load   Called once pjax html has been loaded.
 *      unload Called before pjax html is deleted.
 *             Events within container will be automatically removed.
 * @param {object} options is information of the pjax request. On load:
 *    {boolean} options._isFirstCallRoute if first time controller called.
 *        e.g. ex1/club
 *    {boolean} options._isFirstCallPath if first time URL's path called.
 *        e.g. ex1/club?region=r1&club=c1
 *    {boolean} options._isFromServer if PJAX content comes from server,
 *        else it comes from cache via back/forward buttons.
 * @param {string} path is (X-PJAX-URL) path being loaded/unloaded.
 * @param {string} containerId is id of the container being loaded/unloaded.
 */

PJAX.controllers['ex1/club'] = function
    (action, options, path, containerId) {

  var config = {
    data: { acct: 123},
    qs: PJAX.qs.parseQs(window.location.search, false),
    hash: PJAX.qs.parseQs(window.location.hash, true),
    routes: {

      /**
       * 1. This route is used on an anchor (<a pjax-route="screen1">blah</a>).
       * It produces a PJAX GET request to the server. The query string is
       * formed from paramsQs e.g. /ex1/screen1?region=r1&club=c1&acct=123
       * 2. The server's handler for route /ex1/screen1 uses the query string,
       * plus any session data is has stored, to render the HTML fragment.
       * 3. That handler also creates a URL which is displayed on the browser
       * address line e.g. /ex1/screen1?region=r1&club=c1&acct=123&name=Johnny
       * 4. That URL can be bookmarked by the user and pointed to at a later
       * time. So it must contain all the state needed by the server to recreate
       * the page.
       * 5. Once the HTML fragment has been placed in its container, the
       * frontend handler for /ex1/screen1 is called. It can extract its state
       * info as shown above in the qs and hash properties.
       */
      screen1: {
        path: '/ex1/screen1', container: '',
        paramsQs: ['region', 'club', 'acct']
      },

      /**
       * 1. This route is used on an form tag
       * <form pjax-route="ex1_club_post" method="POST" data-abide="ajax">
       * and produces a PJAX POST request to the server.
       * 2. A POST request is handled just like the GET request above.
       * 3. The form field values are sent in the body of the POST request, so
       * they do not need to be in the query string. No query string is needed
       * (paramsQs: null) if the request body contains all the data required
       * by the server.
       */
      ex1_club_post: {
        path: '/ex1/club',
        paramsQs: null
      }
    }
  };

  logPjaxController(arguments, config);

  var regions = PJAX.data['ex1/club'].regions,
    clubs = PJAX.data['ex1/club'].clubs;

  var $container = $('#' + containerId),
    $region = $container.find('#region'),
    $club = $container.find('#club');

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

    // EVENT HANDLERS
    $region.on('click', function () {
      var region = $region.find('option:selected').val();
      _loadClubOptions (region);
    });

    // CRAZYGLUE BINDINGS
    var gender = new CrazyGlue('#gender'),
      sex = new CrazyGlue('input:radio[name=sex]',
        function (val) { gender.change(JSON.stringify(val) || ''); }
      );

    var zoo = new CrazyGlue('#zoo'),
      animal = new CrazyGlue('input:checkbox[name=animal]',
        function (val) { zoo.change(JSON.stringify(val) || ''); }
      );

  } else { } // pjax being unloaded

  function _loadClubOptions (region) {

    var str = '';
    if (clubs[region]) {
      clubs[region].forEach(function (club) {
        str += [
          '<option value="',
          club[0],
          '"',
          '>',
          club[1],
          '</option>\n'
        ].join('');
      })
    }

    $club.html(str);
  }
};

// ===========================================================================

PJAX.controllers['ex1/team'] = function
  (action, options, path, containerId, otherRoute, otherContainer) {

  var config = {
    data: { },
    qs: PJAX.qs.parseQs(window.location.search),
    hash: PJAX.qs.parseQs(window.location.hash),
    routes: {
      ex1_team_post: {
        path: '/ex1/team',
        paramsQs: ['region', 'club', 'teams' ]
      }
    }
  };

  logPjaxController(arguments, config);

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

  } else { } // pjax being unloaded
};

// ===========================================================================

PJAX.controllers['ex1/schedule'] = function
  (action, options, path, containerId, otherRoute, otherContainer) {

  var config = {
    data: { },
    qs: PJAX.qs.parseQs(window.location.search),
    hash: PJAX.qs.parseQs(window.location.hash)
  };

  logPjaxController(arguments, config);

  if (action === 'load') { // PJAX loaded

    if (options._isFirstCallRoute) { } // first call to controller
    if (options._isFirstCallPath) { } // first call for path
    if (options._isFromServer) { // loaded from the server
    } else { } // loaded from cache

    $('#' + containerId).foundation();
    PJAX.app.addToolkitHandlers(containerId, config);

  } else { } // pjax being unloaded
};

function logPjaxController (args, config) {
  if (args[0] === 'load') {
    console.log('\n===> PJAX action=', args[0], '; path=', args[2],
      '; containerId=', args[3]);
    console.log('=> window.location.href=', window.location.href);

    var options = args[1];
    if (options._isFirstCallRoute) { console.log('=> first call to controller'); }
    if (options._isFirstCallPath) { console.log('=> first call for path'); }
    if (options._isFromServer) { console.log('=> HTML loaded from server (not from cache)');
    } else { console.log('=> HTML retrieved from cache (not from sever)'); }

    if (config) {
      console.log('=> config.qs=', config.qs);
      console.log('=> config.hash=', config.hash);
    }

  } else {
    console.log('\n<= PJAX action=', args[0], '; path=', args[2],
      '; containerId=', args[3], '\n');
  }
}

