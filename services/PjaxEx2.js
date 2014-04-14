'use strict';

var PJAX = {

  /**
   * Log functions =============================================================
   */

  // log controller entry
  logReqInfo: function (route, req) {
    console.log('\n===> http request=', req.route.method.toUpperCase(), req.url);
    console.log('=> route handler=' + route + '; X-PJAX header=', req.header('X-PJAX'));

    //console.log('=> original url=', req.originalUrl);
    console.log('=> req.query=', req.query);
    console.log('=> req.body=', req.body);
    console.log('=> req is ' + (req.header('X-PJAX') ? '' : 'not ') +
      'a PJAX request');
  },

  // log controller rendering template
  logResInfo: function (view, url, res) {
    // res.locals is a function with properties, so we can't JSON.stringify it.
    var locals = {};
    for (var key in res.locals) {
      if (res.locals.hasOwnProperty(key)) {
        locals[key] = res.locals[key];
      }
    }

    console.log('\n\n<= rendering view=', view);
    //console.log('<= with res.locals=', locals);
    console.log('<= setting client URL=', url || '(not set)');
  },

  // log controller redirecting
  logRedirectInfo: function (url, req) {
    console.log('\n\n<= redirecting to=', url);
    console.log('<= this will ' + (req.header('X-PJAX') ? '' : 'not ') +
      'be a PJAX request');
  },

  /**
   * Query string functions ====================================================
   */

  qs: { // source shared with PJAX.qs in jquery-pjax-toolkit
    options: { array: '[]', obj: '.' }, // configures PJAX.qs.stringifyQs

    /**
     * Convert an object into a query string. See parseQs.
     * @param {object} obj is the object.
     *
     * Formatting options are in PJAX.qs.options :
     *    options.array ''    => a=0&a=1&a=2
     *                  '[]'  => a[]=0&a[]=1&a[]2
     *                  else  => a[0]=0&a[1]=1&a[2]=2
     *    options.obj   '[]'  => a[b][c]=5
     *                  else  => a.b.c=5
     * @returns {string} the query string
     */

    stringifyQs: function (obj) {
      var url = '',
        options = PJAX.qs.options;
      if (!obj) { return url; }

      for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
          url += (url ? '&' : '') + createString(name, obj[name]);
        }
      }

      return url;

      function createString(name, value) {
        var url = '', str;

        // Check this way so code can be reused on Nodejs.
        if (Object.prototype.toString.call(value) === '[object Array]' ) {

          for (var i = 0, len = value.length; i < len; i += 1) {
            if (typeof value[i] !== 'undefined') {

              if (options.array === '') {
                str = '';
              } else if (options.array === '[]') {
                str = '[]';
              } else {
                str = '[' + i + ']';
              }

              url += (url ? '&' : '') + name + str + '=' + value[i];
            }
          }
          return url;

        } else if (typeof value === 'object') {

          for (var prop in value) {
            if (value.hasOwnProperty(prop)) {

              if (options.obj === '[]') {
                str = '[' + prop + ']';
              } else {
                str = '.' + prop;
              }

              url += (url ? '&' : '') + createString(name + str, value[prop]);
            }
          }
          return url;

        } else {
          return name + '=' + value;
        }
      }
    }
  },

  /**
   * Get the query string + hash from the request's URL
   * @param {*} req
   * @returns {string} the qs + hash, or ''.
   */

  getQueryString: function (req) {
    var i = req.url.indexOf('?');
    return i === -1 ? '' : req.url.substr(i);
  },

  /**
   * URL creation functions ====================================================
   */

  /**
   * Convert path and object into a URL with a query string.
   * @param {string} path may contain query string e.g. /ex1/club?region=r1
   * @param {object} state
   * @return {string} URL
   */

  getUrlFromState: function (path, state) { // todo used by appEx1, not appEx2
    var qs = PJAX.stringifyParamsState(state);

    if (qs) { qs = (path.indexOf('?') === -1 ? '?' : '&') + qs; }

    return path + qs;
  },

  stringifyParamsState: function (state) { // todo used by appEx1, not in appEx2
    var obj = {},
      names = Object.getOwnPropertyNames(state).sort(); // predicable name order

    names.forEach(function (name) {
      var value = state[name];
      if (typeof value !== 'undefined') { obj[name] = value; }
    });

    return PJAX.qs.stringifyQs(obj);
  },

  /**
   * Convert path and variable names into a URL with a query string.
   * @param {object} req
   * @param {object} res
   * @param {string} path may contain query string e.g. /ex1/club?region=r1
   * @param {*} names of variables to place in query string. String or array.
   *    See getParamExpress for details.
   * @return {string} URL
   */

  getUrlExpress: function (req, res, path, names) {
    var qs = PJAX.stringifyParamsExpress(req, res,
      typeof names === 'string' ? [names] : names);

    if (qs) { qs = (path.indexOf('?') === -1 ? '?' : '&') + qs; }

    return path + qs;
  },

  stringifyParamsExpress: function (req, res, names) {
    if (typeof names === 'undefined' || typeof names === 'null') { return '';}

    var obj = {};
    (typeof names === 'string' ? [names] : names).forEach(function (name) {
      var value = PJAX.getParamExpress(req, res, name);
      if (typeof value !== 'undefined') { obj[name] = value; }
    });

    return PJAX.qs.stringifyQs(obj);
  },


  /**
   * Return the value of 'name' when present. Used with Express.
   * Lookup is performed in the following order:
   * 1. req.params
   * 2. req.body
   * 3. req.query
   * 4. req.session
   * 5. req.locals
   * @param {object} req
   * @param {object} res
   * @param {string} name
   * @returns {*} value of name, or undefined
   */

  getParamExpress: function (req, res, name) {

    var value = req.param(name);
    var type = typeof value;
    if (type !== 'undefined' && type !== 'null') { return value; }

    value = req.session[name];
    type = typeof value;
    if (type !== 'undefined' && type !== 'null') { return value; }

    value = res.locals[name];
    type = typeof value;
    if (type !== 'undefined' && type !== 'null') { return value; }

    return undefined;
  },

  /**
   * Utility functions =========================================================
   */

  /**
   * Save detected client features.
   * @param {object} req
   * @param {function} fcn to extract and store detected client features.
   *    (1) The optional req.query._widths is parsed into
   *    req.session._widths = [ $(window).width() , $(document).width() ].
   *    (2) The optional req.query._features contains the JSON.stringify
   *    of jquery-pjax-toolkit's PJAX.feature.getModernizrFeatures().
   *    The optional fcn is called with the parsed obj so it can save the
   *    features it wants, probably in req.session.
   *    The default is to save the parsed obj as req.session._feature,
   *    but this may easily consume too much memory.
   */

  extractDetectedClientFeatures: function (req, fcn) {

    var widths = req.query._widths;
    if (typeof widths === 'string') {
      req.session._widths = widths.split(',') || [0, 0];
    }

    var features = req.query._features;
    if (features) {

      try {
        features = JSON.parse(features);
      } catch (e) {
        features = { _base: ['_invalid'] };
      }

      if (fcn) {
        fcn(features);
      } else {
        req.session._features = features;
      }
    }
  },

  /**
   * Coerce an object's properties to be arrays.
   * @param {object} obj. obj[prop] may be MODIFIED BY THIS CALL
   * @param {string} arguments are the properties in obj
   */

  coercePropsToArray: function getObjProp (obj /* args */) {

    for (var i = 1, len = arguments.length; i < len; i += 1) {
      var prop = arguments[i],
        value = obj[prop];

      if (typeof value === 'undefined') {
        obj[prop] = [];
      } else if (Object.prototype.toString.call(value) !== '[object Array]') {
        obj[prop] = [value];
      }
    }
  },

  /**
   * Template helper functions
   */

  template: {

    /**
     * Convenience method
     */

    _getSelected: function (state, value) {
      return PJAX.template._getChecked(state, value, 'selected');
    },

    /**
     * Helper returns checked or selected if appropriate
     * @param {*} state. The value being compared. String or array.
     * @param {string} value compared to.
     * @param {string} attr to return if value is/is-in state. Default 'checked'.
     * @returns {string} ' ' + attr, or ''
     *
     * The comparison coerces 'state' (if its a string) and 'value' to strings,
     * since string state values may have been silently coerced to numeric.
     */

    _getChecked: function (state, value, attr) {
      if (typeof attr === 'undefined') { attr = 'checked'; }

      if (typeof state === 'string') {
        return (state + '') === (value + '') ? ' ' + attr : '';
      } else {
        return state.indexOf(value + '') !== -1 ? ' ' + attr : '';
      }
    }
  }
};

module.exports = PJAX;