import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

import knex from '../db/connection';
import authHelpers from './helpers';

let opts: any = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('JWT'),
  secretOrKey: process.env.TOKEN_SECRET,
};

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const user = await knex('Users').where({ username: jwt_payload.username }).first();

      if (!user) return done(null, false, 'El usuario no existe');

      if (!authHelpers.comparePass(jwt_payload.password, user.password)) {
        return done(null, false, 'Contrasena incorrecta');
      } else {
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.use(
  new LocalStrategy(opts, async (username, password, done: any) => {
    try {
      const user = await knex('Users').where({ username }).first();

      if (!user) return done(null, false, 'El usuario no existe');

      if (!authHelpers.comparePass(password, user.password)) {
        return done(null, false, 'Contrasena incorrecta');
      } else {
        user.token = authHelpers.encodeToken(user);
        return done(null, user);
      }
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await knex('Users').where({ id }).first();

    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
