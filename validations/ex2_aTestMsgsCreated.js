module.exports.abide = {
  a: {
    required: true,
    pattern: 'alphaLen',
    minLen: 3,
    maxLen: 15,
    msg: 'Use this for the message'
  },

  r11: {
    required: true,
    pattern: 'alphaLen',
    minLen: 3,
    maxLen: 15
  },
  r12: {
    required: true,
    pattern: 'alphaLen',
    minLen: 3
  },
  r13: {
    required: true,
    pattern: 'alphaLen',
    maxLen: 15
  },
  r14: {
    required: true,
    pattern: 'alphaLen'
  },

  r21: {
    required: true,
    pattern: 'alpha_numericLen',
    minLen: 3,
    maxLen: 15
  },
  r22: {
    required: true,
    pattern: 'alpha',
    minLen: 3,
    maxLen: 15
  },
  r23: {
    required: true,
    pattern: 'alpha_numeric',
    minLen: 3,
    maxLen: 15
  },

  r31: {
    required: true,
    minLen: 3,
    maxLen: 15
  },
  r32: {
    required: true,
    minLen: 3
  },
  r33: {
    required: true,
    maxLen: 15
  },
  r34: {
    required: true
  },

  n11: {
    pattern: 'alphaLen',
    minLen: 3,
    maxLen: 15
  },
  n12: {
    pattern: 'alphaLen',
    minLen: 3
  },
  n13: {
    pattern: 'alphaLen',
    maxLen: 15
  },
  n13b: {
    pattern: 'alphaLen',
    minLen: 0,
    maxLen: 15
  },
  n14: {
    pattern: 'alphaLen'
  },

  n21: {
    pattern: 'alpha_numericLen',
    minLen: 3,
    maxLen: 15
  },
  n22: {
    pattern: 'alpha',
    minLen: 3,
    maxLen: 15
  },
  n23: {
    pattern: 'alpha_numeric',
    minLen: 3,
    maxLen: 15
  },

  n31: {
    minLen: 3,
    maxLen: 15
  },
  n32: {
    minLen: 3
  },
  n33: {
    maxLen: 15
  },
  n34: {
  }
};