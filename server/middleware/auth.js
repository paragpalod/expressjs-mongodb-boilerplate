const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { serverSecret } = require('../config');
const { CatchError } = require('../utils/error');

const authorization = async (req, res, next) => {
  try {
    // verify user jwt token if expired or invalid trow 401 so user will be logged out
    const DECODE = await jwt.verify(req.headers.authorization, serverSecret, (err, decoded) => {
      if (err) throw { message: 'Missing Authentication', status_code: 401 };
      return decoded;
    });
    if (!DECODE) throw { message: 'Missing Authentication', status_code: 401 };

    // finding user and saving user info in user_info key in reuest to access user info after authorization
    const userFields = [
      'first_name',
      'last_name',
      'mobile',
      'email',
      'is_verified',
      'deleted_at',
      'user_type'
    ];
    const USER = await User.findById(DECODE._id).select(userFields.join(' '));
    if (!USER || !USER.is_verified || USER.deleted_at) {
      throw { message: 'Missing Authentication', status_code: 401 };
    }
    req.user_info = USER;
    next();
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

module.exports = {
  authorization
};
