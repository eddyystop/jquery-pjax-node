'use strict';

var Joi = require('joi'),
  fs = require('fs'),
  i18n = require('i18n');

/** ============================================================================
 * Build validation schemas for ./validations/*.js
 */

var  abideSchemas = {},
  joiSchemas = {},
  parsleySchemas = {};

var DEFAULT_CLIENT_VALIDATION = 'abide',
  DEFAULT_JOI_OPTIONS = { //todo have call to customize, with extend.
    abortEarly: false,
    modify: true,
    allowUnknown: true,
    languagePath: '../locales/en.json'
  };

/** ============================================================================
 * Parse validations
 */

var files = fs.readdirSync('./validations/');

files.forEach(function (fileName) {
  var type = fileName.substr(fileName.length - 3);

  if (type === '.js') {
    var moduleName = fileName.substr(0, fileName.length - 3);
    var exports = require('../validations/' + moduleName);
    parseValidation(moduleName, exports.parsley, exports.abide,
      exports.joi);
  }
});

/**
 * Parse a form's validation
 * @param {string} formName identifies form e.f. ex2_club for route /ex2/club
 * @param {object} parsley definition structure
 * @param {object} abide definition structure
 * @param {function} joi definition structure
 */
function parseValidation (formName, parsley, abide, joi) {
  if (parsley) {
    parsleySchemas[formName] = makeParsleySchema(parsley);
  }
  if (abide) {
    abideSchemas[formName] = makeAbideSchema(abide);
    //console.log('@abideSchema for', formName, abideSchemas[formName]); //todo remove all console.log
  }
  if (joi) {
    joiSchemas[formName] = makeJoiSchema(joi);
  }
}

/** ============================================================================
 * Functions to create Abide schemas
 */

function makeAbideSchema (abide) {
  var res = {};

  // each field in schema
  for (var field in abide) {
    if (abide.hasOwnProperty(field)) {
      //console.log('@ abide field', field);
      res[field] = makeAbideFieldAttrs(abide[field]);
      //console.log('@ res=', res[field]);
    }
  }

  return res;
}

/**
 * Return Abide validation for a field
 * @param {object} fieldSchema is the validation info
 *    .pattern {string} is the Abide or custom pattern name, or a regex string.
 *    .minLen {numeric or string} optional minimum length
 *    .maxLen {numeric or string} optional maximum length
 *    .required {boolean} if field is required. Optional.
 * @returns {object} the Abide validation schema
 *    .pattern {string} is the Abide or custom pattern name, or a regex string.
 *    .minLen {numeric or string} minimum length or ''.
 *    .maxLen {numeric or string} maximum length or ''.
 *    .required {boolean} if field is required.
 *    .message {string} characteristics suitable for an error message
 *        e.g. 'alphabetic, 3 to 15 long, required.'
 *
 * About .pattern:
 * You can find the validation pattern names built into Abide at
 * http://foundation.zurb.com/docs/components/abide.html
 *
 * You can use these additional pattern names. They are converted to regex
 * pattern by this function; nothing extra is needed at the frontend.
 * alpha_len          like Abide's alphabut minLen or maxLen chars
 * alphanumeric_len   like Abide's alphanumeric but minLen or maxLen chars
 * password_len       minLen to maxLen chars
 *
 * You can alternatively include any regex you want.
 *
 * Misc:
 * - Abide requires <input type="password"> have upper- and lower-case chars.
 */

function makeAbideFieldAttrs (fieldSchema) {
  var CUSTOM_PATTERNS= {
      alphaLen: '^[a-zA-Z]{~~minLen,~~maxLen}$',
      alpha_numericLen: '^[a-zA-Z0-9]{~~minLen,~~maxLen}$',
      passwordLen: '(?=^.{~~minLen,~~maxLen}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$'
    };

  var required = !!fieldSchema.required,
    minLen = fieldSchema.minLen,
    maxLen = fieldSchema.maxLen,
    schemaPattern = fieldSchema.pattern || '',
    message = fieldSchema.message;

  var pattern = (CUSTOM_PATTERNS[schemaPattern] || schemaPattern)
    .replace('~~minLen', typeof minLen !== 'undefined' ? minLen + '' : '0')
    .replace('~~maxLen', typeof maxLen !== 'undefined' ? maxLen + '' : '');

  message = message ? message : getReasonableAbideMsg(required, schemaPattern, minLen, maxLen);

  return {
    required: required,
    minLen: minLen || 0,
    maxLen: maxLen,
    pattern: pattern,
    attrs: (pattern ? 'pattern="' + pattern + '" ' : '') +
      (required ? 'required' : ''),
    message: message
  };

  function getReasonableAbideMsg (required, schemaPattern, minLen, maxLen) {
    var LEN_MSG = [ '', 'At least {0}', 'Up to {1}', '{0} to {1}' ],
      TYPE_MSG = {
        // patterns built into abide
        alpha: 'letters',
        alpha_numeric: 'letters or numbers',
        password: 'chars',
        // our additional patterns
        alphaLen: 'letters',
        alpha_numericLen: 'letters or numbers',
        passwordLen: 'chars'
      };

    var isSchemaPatternRegex = schemaPattern.charAt(0) === '/';

    if (schemaPattern && !CUSTOM_PATTERNS[schemaPattern] && !isSchemaPatternRegex) {
      minLen = maxLen = undefined; // exclude extraneous info from msg
    }

    // We leave placeholders for the lengths: {0} = minLen & {1} = maxLen.
    // The template will get the msg and the length. It must replace the
    // placeholders after localizing the msg with i18n. Otherwise there'd be a
    // unique msg for every length combo defined which we'd have to translate.
    var lenMsg = LEN_MSG[!!minLen + 2 * !!maxLen];

    var typeMsg = isSchemaPatternRegex ? '' :
        (TYPE_MSG[schemaPattern] ? TYPE_MSG[schemaPattern] : schemaPattern);

    var msg;
    if (required) {
      if (!lenMsg && !typeMsg && isSchemaPatternRegex) { msg = 'A valid value is required.'; }
      if (!lenMsg && !typeMsg && !isSchemaPatternRegex) { msg = 'A value is required.'; }
      if (!lenMsg && typeMsg) { msg = typeMsg + ' required.'; }
      if (lenMsg && !typeMsg) { msg = lenMsg + ' char required.'; }
      if (lenMsg && typeMsg) { msg = lenMsg + ' ' + typeMsg + ' required.'; }
    } else {
      if (!lenMsg && !typeMsg && isSchemaPatternRegex) { msg = 'Enter a valid value.'; }
      if (!lenMsg && !typeMsg && !isSchemaPatternRegex) { msg = 'Enter a value.'; } // should never appear
      if (!lenMsg && typeMsg) { msg = 'Enter valid ' + typeMsg + '.'; }
      if (lenMsg && !typeMsg) { msg = 'Enter ' + lenMsg + ' char.'; }
      if (lenMsg && typeMsg) { msg = 'Enter ' + lenMsg + ' ' + typeMsg + '.'; }
    }

    return msg.charAt(0).toUpperCase() + msg.substr(1);
  }
}

/** ============================================================================
 * Functions to create Parsley schemas
 */

function makeParsleySchema (parsley) {
  var res = {};

  // each field in schema
  for (var field in parsley) {
    if (parsley.hasOwnProperty(field)) {
      res[field] = makeParsleyFieldAttrs(parsley[field]);
    }
  }

  return res;
}

/**
 * Return Parsley validation for a field
 * @param {object} fieldSchema is the validation info
 *    .type {string} is the Sailsjs type.
 *    .minLen {numeric or string} optional minimum length
 *    .maxLen {numeric or string} optional maximum length
 *    .rangeLength {array} optionalrange of lengths.
 *        [0] {numeric or string} minimum length.
 *        [1] {numeric or string} maximum length.
 * @returns {string} Parsley tag attributes
 */

function makeParsleyFieldAttrs (fieldSchema) {
  var  res = '',
    types = {
      string: ['parsley-type="alphanum"']
    };

  // each attr in field schema
  for (var attr in fieldSchema) {
    if (fieldSchema.hasOwnProperty(attr)) {
      var attrValue = fieldSchema[attr];

      switch (attr) {
        case 'type':
          res += (types[attrValue][0] || '') + ' ';
          break;
        case 'minLen':
          res += 'parsley-minLen="' + attrValue + '" ';
          break;
        case 'maxLen':
          res += 'parsley-maxLen="' + attrValue + '" ';
          break;
        case 'rangeLength':
          res += 'parsley-rangelength="[' + attrValue[0] + ',' +
            attrValue[1] + ']" ';
          break;
        default:
      }
    }
  }

  return res;
}

/** ============================================================================
 * Functions to create Joi schemas
 */

/**
 * Return Joi validation for a field
 * @param {object} joi is the validation info
 *    .schema {function} is the Joi definition fcn.
 *    .overrideMsgs {object} .overrideMsgs[fieldName] use instead of Joi msg
 * @returns {object} the Joi validation schema
 *    .schema {function} is the Joi definition e.g. joi.schema().
 *    .overrideMsgs {object} is joi.overrideMsgs.
 */

function makeJoiSchema (joi) {

  return {
    schema: joi.schema(Joi),
    overrideMsgs: joi.overrideMsgs || {}
  };
}

/** ============================================================================
 * Functions to use schemas
 */

/**
 * Get HTML attrs for client validation.
 * @param {string} modelName is the name of the model (or form e.g. prAddForm)
 * @param {string} schemaType is 'abide' or 'parsley'. Defaults to pkge default.
 * @returns {object} validation info depends on validation engine used.
 */


function getClientModelValidation (modelName, schemaType) {
  modelName = modelName.replace(/\//, '_');

  var schema = {};
  if (schemaType || DEFAULT_CLIENT_VALIDATION === 'abide') {
    // ABIDE
    extend(schema, abideSchemas[modelName] || {}); // avoid race cond

    for (var key in schema) {
      if (schema.hasOwnProperty(key)) { // suppress hint msg, not really needed
        var field = schema[key];
        //todo i18n (localize) field.message here
        field.msg = replacePlaceHolders(field.message || '', field.minLen, field.maxLen);
      }
    }

    return schema;
  } else {
    // PARSLEY
    schema = parsleySchemas[modelName] || {};

    return schema;
  }

  function replacePlaceHolders (str /* ...args */) {
    var args = arguments;
    return str.replace(/\{(\d+)\}/g, function (subStr, subMatch) {
      return args[parseInt(subMatch, 10) + 1] || undefined;
    });
  }
}

/**
 * Perform Joi validation of data object
 * @param {object} obj is the data, usually req.body
 * @param {string} modelName is the name of the model e.g. signin/club
 * @param {object} req is the request object. Used for internationalization.
 * @param {object} options is the Joi options object.
 * @returns {object} A Joi error object.
 *                  The .message is converted to an array in the added .messages.
 *
 * options, or req + options may missing.
 */

function getMessagesFromServerModelValidation (obj, modelName, req, options) {
  modelName = modelName.replace(/\//, '_'); // ex2/club (route) => ex2_club (file)

  var joiOptions = {};
  extend(joiOptions, DEFAULT_JOI_OPTIONS);
  extend(joiOptions,  options || {});

  if (req) {
    joiOptions.languagePath = '../languages/' + i18n.getLocale(req) + '.json'; //todo
  }

  var schema = joiSchemas[modelName].schema,
    joiErr = schema ? Joi.validate(obj, schema, joiOptions) : false;

  // replace messages with overrideMsgs & format messages
  if (joiErr) {
    var overrideMsgs = joiSchemas[modelName].overrideMsgs;

    joiErr.details.forEach(function (field) {
      var overrideMsg = overrideMsgs[field.path];

      if (overrideMsg) {
        overrideMsg += '.'; // needed for .split('. ') below
        joiErr.message = joiErr.message.replace(field.message, overrideMsg);
        field.message = overrideMsg;
      }

      field.message = formatMsg(field.message);
    });

    joiErr.messages = joiErr.message.split('. ') || [];
    joiErr.messages.forEach(function (msg, i) {
      joiErr.messages[i] = formatMsg(joiErr.messages[i]);
    });
  }

  return joiErr;

  function formatMsg (msg) {
    return msg.charAt(0).toUpperCase() + msg.substr(1);
  }
}

/**
 * Utility functions
 */

function displayJoiErrors (err) {
  if (!err) { return; }
  console.log(err);

  var messages = err.message.split('. ');
  messages.forEach(function (message, i) {
    messages[i] = message.charAt(0).toUpperCase() + message.substr(1) + '.';
  });

  console.log('\n=== joi ====================================================');
  console.log('=== object\n', err._object);
  console.log('=== messages');
  messages.forEach(function (message, i) {
    console.log(message);
  });
  err.details.forEach(function (error) {
    console.log('=== field', error.path, '\nmessage:', error.message);
  });
}

function extend (a, b) {
  for (var x in b) {
    if (b.hasOwnProperty(x)) { // suppress hint msg, not really needed
      a[x] = b[x];
    }
  }
}

/**
 * Module exports
 */

module.exports = {
  parseValidation: parseValidation,
  getClientModelValidation: getClientModelValidation,
  getMessagesFromServerModelValidation: getMessagesFromServerModelValidation,
  displayJoiErrors: displayJoiErrors
};
