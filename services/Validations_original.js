'use strict';

var Joi = require('joi'),
  fs = require('fs'),
  i18n = require('../../node_modules/sails/node_modules/i18n');

/** ============================================================================
 * Build validation schemas for ./validations/*.js
 */

var parsleySchemas = {},
  abideSchemas = {},
  joiSchemas = {};

var DEFAULT_CLIENT_VALIDATION = 'abide',
  DEFAULT_JOI_OPTIONS = {
    abortEarly: false,
    modify: true,
    allowUnknown: true,
    languagePath: '../languages/en-us.json'
  };

var x = '-?\\d+',
  y = new RegExp(x);
console.log('regex y=', y);

fs.readdir('./validations/', function(err, files) {
  if (err) { throw err; }

  files.forEach(function (fileName) {
    var type = fileName.substr(fileName.length - 3);

    if (type === '.js') {
      var moduleName = fileName.substr(0, fileName.length - 3);
      var exportHandle = require('../../validations/' + moduleName);
      addSchema(moduleName, exportHandle.parsley, exportHandle.abide,
        exportHandle.joi(Joi));
    }
  });
});

function addSchema (formName, parsley, abide, joiSchema) {
  if (parsley) { parsleySchemas[formName] = makeParsleySchema(parsley); }
  if (abide) {
    abideSchemas[formName] = makeAbideSchema(abide);
    //console.log('@abideSchema for', formName, abideSchemas[formName]);
  }
  if (joiSchema) { joiSchemas[formName] = joiSchema; }
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
 *    .minLength {numeric or string} optional minimum length
 *    .maxLength {numeric or string} optional maximum length
 *    .required {boolean} if field is required. Optional.
 * @returns {object} the Abide validation schema
 *    .pattern {string} is the Abide or custom pattern name, or a regex string.
 *    .minLength {numeric or string} minimum length or ''.
 *    .maxLength {numeric or string} maximum length or ''.
 *    .required {boolean} if field is required.
 *    .message {string} characteristics suitable for an error message
 *        e.g. 'alphabetic, 3 to 15 long, required.'
 */

function makeAbideFieldAttrs (fieldSchema) {
  //console.log('@schema', fieldSchema);
  var CUSTOM = {
      alphaLength: '^[a-zA-Z]{~~minLength,~~maxLength}$',
      alphanumLength: '^[a-zA-Z0-9]{~~minLength,~~maxLength}$',
      passwordLength: '(?=^.{~~minLength,~~maxLength}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$'
    },
    TYPE_MSG = {
      // builtin
      password: 'char',
      // custom
      alphaLength: 'alphabetic',
      alphanumLength: 'alphanumeric',
      passwordLength: 'char'
    },
    LEN_MSG = [
      '',
      'at least ~~minLength',
      'up to ~~maxLength',
      '~~minLength to ~~maxLength'
    ];

  var  required = !!fieldSchema.required,
    minLength = fieldSchema.minLength,
    maxLength = fieldSchema.maxLength,
    pattern = fieldSchema.pattern || '';

  var customPattern = (CUSTOM[pattern] || pattern)
    .replace('~~minLength', typeof minLength !== 'undefined' ? minLength + '' : '0')
    .replace('~~maxLength', typeof maxLength !== 'undefined' ? maxLength + '' : '');

  var lenMessage = LEN_MSG[!!minLength + 2 * !!maxLength]
    .replace('~~minLength', minLength || 0)
    .replace('~~maxLength', maxLength);

  return {
    required: required,
    minLength: minLength,
    maxLength: maxLength,
    pattern: customPattern,
    attrs: (required ? 'required ' : '') +
      (customPattern ? 'pattern="' + customPattern + '"' : ''),
    message: lenMessage +
      (TYPE_MSG[pattern] ? ' ' + TYPE_MSG[pattern] : '') +
      (required ? ', required' : '') +
      '.'
  };
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
 *    .minLength {numeric or string} optional minimum length
 *    .maxLength {numeric or string} optional maximum length
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
        case 'minLength':
          res += 'parsley-minlength="' + attrValue + '" ';
          break;
        case 'maxLength':
          res += 'parsley-maxlength="' + attrValue + '" ';
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
 * Functions to use schemas
 */

/**
 * Get HTML attrs for client validation.
 * @param {string} modelName is the name of the model (or form e.g. prAddForm)
 * @param {string} schemaType is 'abide' or 'parsley'. Defaults to pkge default.
 * @returns {string} attrs to place in tag.
 */


function getClientModelValidation (modelName, schemaType) {
  //console.log('get client', modelName, schemaType, DEFAULT_CLIENT_VALIDATION);
  //console.log(abideSchemas[modelName]);
  modelName = modelName.replace(/\//, '_');
  return (schemaType || DEFAULT_CLIENT_VALIDATION) === 'abide' ?
    abideSchemas[modelName] || {} :
    parsleySchemas[modelName] || {};
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
  modelName = modelName.replace(/\//, '_');
  var joiOptions = Utils.mergeInObject(Utils.deepCopy(DEFAULT_JOI_OPTIONS), options || {});
  if (req) {
    joiOptions.languagePath = '../languages/' + i18n.getLocale(req) + '.json';
  }

  var schema = joiSchemas[modelName],
    err = schema ? Joi.validate(obj, schema, joiOptions) : false;

  // format messages
  if (err) {
    var messages = err.message.split('. ');
    messages.forEach(function (message, i) {
      messages[i] = message.charAt(0).toUpperCase() + message.substr(1) + '.';
    });
    err.messages = messages;
  }

  return err;
}

/** ============================================================================
 * Helpers for routes displaying forms, or validating POST from forms
 */

function updateLocalsBeforeFormRender (resLocals) {
  if (!resLocals.flash) { resLocals.flash = {}; }
  if (!resLocals.flash.values) { resLocals.flash.values = {}; }
}

function updateSessionAfterValidation (reqSession, reqBody, err) {
  if (err) {
    if (!reqSession.flash) { reqSession.flash = {}; }
    reqSession.flash.err = err.messages || null;
    reqSession.flash.values = reqBody || {};
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
  err._errors.forEach(function (error) {
    console.log('=== field', error.path, '\nmessage:', error.message);
  });
}

/**
 * Module exports
 */

module.exports = {
  addSchema: addSchema,
  getClientModelValidation: getClientModelValidation,
  getMessagesFromServerModelValidation: getMessagesFromServerModelValidation,
  updateLocalsBeforeFormRender: updateLocalsBeforeFormRender,
  updateSessionAfterValidation: updateSessionAfterValidation,
  displayJoiErrors: displayJoiErrors
};
