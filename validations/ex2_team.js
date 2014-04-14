module.exports.abide = {
  teams: {
    required: true
  }
};

module.exports.joi = {
  schema: function (Joi) {
    return {
      teams: Joi.array().min(2)
    };
  },
  overrideMsgs: {
    //teams: 'Pick 1 or more teams'
  }
};