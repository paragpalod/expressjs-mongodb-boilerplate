const { User } = require('../models');
const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { serverSecret, verificationLink, resetPasswordLink } = require('../config');
const { check, validationResult } = require('express-validator');
const { sendMail } = require('../utils/email');
const { CatchError } = require('../utils/error');
const { authorization } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: All the APIs related avatar in game
 */

/**
  * @swagger
  * path:
  *  /login/:
  *    put:
  *      summary: Login from dashboard for resonate admin/school admin/parent/teacher
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: login
  *        schema:
  *          type: object
  *          required:
  *            - username
  *            - password
  *          properties:
  *            username:
  *              type: string
  *            password:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const where = {};
    if (isNaN(Number(req.body.username))) {
      where.email = req.body.username;
    } else {
      where.mobile = req.body.username;
    }
    const USER = await User.findOne(where);

    // validating USER based on USER info
    if (!USER) throw { message: 'Invalid Credentials', statusCode: 404 };
    if (USER.deletedAt) {
      throw {
        message: 'Your account is deactivated.'
      };
    }
    if (!USER.isVerified) {
      throw {
        message: 'Your account is not verified. Please verify your account and login again.'
      };
    }

    if (!bcrypt.compareSync(req.body.password, USER.hashedPassword)) {
      USER.loginAttempts += 1;
      if (USER.loginAttempts === 5) {
        // if login Attempts are 5 then set lockuntill time = now time + 30 getSeconds, so USER can login after 30 seconds of 5 fail attampts
        USER.lockUntill = new Date(new Date().setSeconds(new Date().getSeconds() + 30));
      } else {
        if (USER.loginAttempts > 5 && new Date() < USER.lockUntill) {
          // after 5 failed attempts USER need to wait for 30 seconds
          throw { message: 'Too many failed login attempts. Please try again in 30 seconds' };
        }
        if (USER.loginAttempts > 5 && new Date() > USER.lockUntill) {
          // on 6 th attempts and after 30 seconds of 5 fail attempts reset login attempts to 1 and lockuntill
          USER.loginAttempts = 1;
          USER.lockUntill = undefined;
        }
      }
      await USER.save();
      throw { message: 'Invalid Credentials' };
    } else {
      if (!USER.lockUntill || new Date() > USER.lockUntill) {
        const token = jwt.sign({
          _id: USER._id
        }, serverSecret, {
          expiresIn: '7 days'
        });

        USER.loginAttempts = 0;
        USER.lockUntill = undefined;
        await USER.save();

        const userInfo = {
          _id: USER._id,
          firstName: USER.firstName,
          lastName: USER.lastName
        };

        return res.send({ token, userInfo });
      } else {
        // If the user is locked, but password entered is correct, user should not be logged in Respective error should be thrown.
        throw { message: 'Too many failed login attempts. Please try again in 30 seconds' };
      }
    }
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /signUp/:
  *    post:
  *      summary: Sign up option for parents via dashboard
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: signUp
  *        schema:
  *          type: object
  *          required:
  *            - firstName
  *            - lastName
  *            - email
  *            - mobile
  *            - password
  *            - confirmPassword
  *          properties:
  *            firstName:
  *              type: string
  *            lastName:
  *              type: string
  *            email:
  *              type: string
  *            mobile:
  *              type: string
  *            password:
  *              type: string
  *            confirmPassword:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const signUp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    // user object to add in database
    const UserObject = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobile: req.body.mobile,
      hashedPassword: bcrypt.hashSync(req.body.password, 13)
    };
    const NEWUSER = await User.create(UserObject);

    const TOKEN = jwt.sign({
      _id: NEWUSER._id
    }, serverSecret, {
      expiresIn: '1 days'
    });

    sendMail(
      `${NEWUSER.firstName} ${NEWUSER.lastName}`,
      NEWUSER.email,
      verificationLink + TOKEN,
      'verifyAccount'
    );

    NEWUSER.verificationToken = TOKEN;
    await NEWUSER.save();
    res.send('SignupSuccess');
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /verifyAccount/:
  *    put:
  *      summary: Verify user account after singup using verificationToken
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: verifyAccount
  *        schema:
  *          type: object
  *          required:
  *            - verificationToken
  *          properties:
  *            verificationToken:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const verifyAccount = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const DECODE = await jwt.verify(req.body.verificationToken, serverSecret, (err, decoded) => {
      if (err) throw { message: 'Session Expired', statusCode: 401 };
      return decoded;
    });
    if (!DECODE) throw { message: 'Verification link expired. Contact resonate admin.' };

    const USER = await User.findById(DECODE._id);
    if (!USER) throw { message: 'User not found', statusCode: 404 };
    if (USER.isVerified) return res.send('AccountAlreadyVerified');
    USER.verificationToken = null;
    USER.isVerified = true;
    await USER.save();
    res.send('VerifyAccountSuccess');
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /validateSession/:
  *    put:
  *      summary: validate session to ensure that user is authorized
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: validateSession
  *        schema:
  *          type: object
  *          required:
  *            - token
  *          properties:
  *            token:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const validateSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(401).json({ errors: errors.array() });

    const DECODE = await jwt.verify(req.body.token, serverSecret);
    if (!DECODE) throw { message: 'Missing authetication', statusCode: 401 };

    const USER = await User.findById(DECODE._id);
    if (!USER) throw { message: 'Missing authetication', statusCode: 401 };

    USER.token = jwt.sign({
      _id: USER._id
    }, serverSecret, {
      expiresIn: '7 days'
    });

    await USER.save();

    const userInfo = {
      _id: USER._id,
      firstName: USER.firstName,
      lastName: USER.lastName
    };

    res.send({ token: USER.token, userInfo });
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /forgetPassword/:
  *    put:
  *      summary: Forget password api to send user reset password link`
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: forgetPassword
  *        schema:
  *          type: object
  *          required:
  *            - email
  *          properties:
  *            email:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const forgetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(401).json({ errors: errors.array() });

    const USER = await User.findOne({ email: req.body.email });
    if (!USER) throw { message: 'User not found.', statusCode: 404 };

    const TOKEN = jwt.sign({
      _id: USER._id
    }, serverSecret, {
      expiresIn: '1 days'
    });

    sendMail(
      `${USER.firstName} ${USER.lastName}`,
      USER.email,
      resetPasswordLink + TOKEN,
      'resetPassword'
    );

    USER.resetPasswordToken = TOKEN;
    await USER.save();

    res.send('ForgetPasswordSuccess');
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /resetPassword/:
  *    put:
  *      summary: Reset user password after validating the reset password token
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: resetPassword
  *        schema:
  *          type: object
  *          required:
  *            - resetPasswordToken
  *            - password
  *            - confirmPassword
  *          properties:
  *            resetPasswordToken:
  *              type: string
  *            password:
  *              type: string
  *            confirmPassword:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(401).json({ errors: errors.array() });

    const DECODE = await jwt.verify(req.body.resetPasswordToken, serverSecret, (err, decoded) => {
      if (err) throw { message: 'Reset password link expired. Request a new link' };
      return decoded;
    });
    if (!DECODE) throw { message: 'Reset password link expired. Request a new link' };

    const USER = await User.findOne({ _id: DECODE._id, resetPasswordToken: req.body.resetPasswordToken });
    if (!USER) throw { message: 'Reset password link is invalid. Request a new link.' };

    USER.resetPasswordToken = null;
    USER.hashedPassword = bcrypt.hashSync(req.body.password, 13);
    await USER.save();

    sendMail(USER.email);

    res.send('resetPasswordSuccess');
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

/**
  * @swagger
  * path:
  *  /changePassword/:
  *    put:
  *      summary: Change user password after validating his old password
  *      tags: [Authentication]
  *      parameters:
  *      - in: body
  *        name: changePassword
  *        schema:
  *          type: object
  *          required:
  *            - oldPassword
  *            - newPassword
  *            - confirmNewPassword
  *          properties:
  *            oldPassword:
  *              type: string
  *            newPassword:
  *              type: string
  *            confirmNewPassword:
  *              type: string
  *      responses:
  *        "200":
  *          description: Ok
  */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(401).json({ errors: errors.array() });

    const USER = await User.findById(req.userInfo._id);
    // if user not found then throw user not found error
    if (!USER) throw { message: 'User not found', statusCode: 404 };

    // if oldPassword do not match user hashed password throw incorect password message
    if (!bcrypt.compareSync(req.body.oldPassword, USER.hashedPassword)) {
      throw { message: 'Incorrect old password.' };
    }

    // hashing new password and saving it on user document
    USER.hashedPassword = bcrypt.hashSync(req.body.newPassword, 13);
    await USER.save();

    sendMail(USER.email);

    res.send('ChangePasswordSuccess');
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

router.put('/login', login);

// this signUp api will only used for parents registration
router.post('/signUp', [
  check('firstName').isLength({ min: 1 }).withMessage('First name is required'),
  check('lastName').isLength({ min: 1 }).withMessage('Last name is required'),
  check('email').isEmail().withMessage('Email Id is not valid.'),
  check('mobile').isMobilePhone(['en-IN']).withMessage('Mobile number is not valid.'),
  check('password').isLength({ min: 6 }).withMessage('Password should be at least 8 character long.'),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Confirm password should match password.');
    else return value;
  })
], signUp);

router.put('/verifyAccount', [
  check('verificationToken').isLength({ min: 1 }).withMessage('Verification Token is required')
], verifyAccount);

router.put('/validateSession', [
  check('token').isLength({ min: 1 }).withMessage('Missing Token')
], validateSession);

router.put('/forgetPassword', [
  check('email').isEmail().withMessage('Enter valid email address')
], forgetPassword);

router.put('/resetPassword', [
  check('resetPasswordToken').isLength({ min: 1 }).withMessage('Reset password link has expired request new one.'),
  check('password').isLength({ min: 8 }).withMessage('Password should be 8 character long'),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Confirm password should match password.');
    else return value;
  })
], resetPassword);

router.put('/changePassword', authorization, [
  check('oldPassword').isLength({ min: 1 }).withMessage('Old password is required.'),
  check('newPassword').isLength({ min: 8 }).withMessage('New password should be 8 character long'),
  check('confirmNewPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Confirm new password should match new password.');
    else return value;
  })
], changePassword);

module.exports = router;
