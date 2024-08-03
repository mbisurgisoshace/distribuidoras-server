import * as express from 'express';
import * as R from 'ramda';

import authHelpers from '../auth/helpers';

const router = express.Router();
const passport = require('../auth/passport');

router.post('/login', async (req: any, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.log('err', err);

      return handleResponse(res, 500, { error: err });
    }
    if (!user) {
      console.log('ono user', info);

      return handleResponse(res, 401, { error: info });
    }
    if (user) {
      const userObj = R.omit(['password', 'token'], user);

      res.status(200).json({
        status: 'success',
        user: userObj,
        token: user.token,
      });
    }
  })(req, res, next);
});

router.post('/signup', async (req, res, next) => {
  try {
    const user = await authHelpers.createUser(req);

    const token = authHelpers.encodeToken(user[0]);

    passport.authenticate('local', (err, user, info) => {
      if (user) {
        const userObj = R.omit(['password', 'token'], user);

        res.status(200).json({
          status: 'success',
          user: userObj,
          token: token,
        });
      }
    })(req, res, next);
  } catch (err) {
    handleResponse(res, err.status || 500, { error: err.message || err });
  }
});

router.put('/change-password', async (req, res, next) => {
  try {
    const user = await authHelpers.changePassword(req);

    const userObj = R.omit(['password', 'token'], user);

    res.status(200).json({
      status: 'success',
      user: userObj,
    });
  } catch (err) {
    handleResponse(res, err.status || 500, { error: err.message || err });
  }
});

function handleResponse(res, code, statusMsg) {
  res.status(code).json(statusMsg);
}

export default router;
