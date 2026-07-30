import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

export function configurePassport(): void {
  // ─── Google Strategy ────────────────────────────────────────────────────────
  const googleClientId = process.env.GOOGLE_CLIENT_ID || 'placeholder_google_client_id';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'placeholder_google_client_secret';
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const name = profile.displayName || profile.name?.givenName || 'Google User';
          const avatar = profile.photos?.[0]?.value;

          // 1. Match by googleId
          let user = await User.findOne({ googleId });
          if (user) {
            return done(null, user);
          }

          // 2. Match by email & link account
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = googleId;
              user.verified = true; // Email verified by Google
              if (!user.oauthProviders?.includes('google')) {
                user.oauthProviders = [...(user.oauthProviders || []), 'google'];
              }
              if (!user.avatar && avatar) {
                user.avatar = avatar;
              }
              await user.save();
              return done(null, user);
            }
          }

          // 3. Create new user
          const newUser = new User({
            name,
            email: email || `${googleId}@google.oauth`,
            googleId,
            verified: true, // Google verifies emails
            avatar,
            role: 'user',
            accountType: 'personal',
            oauthProviders: ['google'],
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );

  // ─── Facebook Strategy ──────────────────────────────────────────────────────
  const facebookAppId = process.env.FACEBOOK_APP_ID || 'placeholder_facebook_app_id';
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET || 'placeholder_facebook_app_secret';
  const facebookCallbackUrl = process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5001/api/auth/facebook/callback';

  passport.use(
    new FacebookStrategy(
      {
        clientID: facebookAppId,
        clientSecret: facebookAppSecret,
        callbackURL: facebookCallbackUrl,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const facebookId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const name = profile.displayName || 'Facebook User';
          const avatar = profile.photos?.[0]?.value;

          // 1. Match by facebookId
          let user = await User.findOne({ facebookId });
          if (user) {
            return done(null, user);
          }

          // 2. Match by email & link account
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.facebookId = facebookId;
              user.verified = true;
              if (!user.oauthProviders?.includes('facebook')) {
                user.oauthProviders = [...(user.oauthProviders || []), 'facebook'];
              }
              if (!user.avatar && avatar) {
                user.avatar = avatar;
              }
              await user.save();
              return done(null, user);
            }
          }

          // 3. Create new user
          const newUser = new User({
            name,
            email: email || `${facebookId}@facebook.oauth`,
            facebookId,
            verified: true,
            avatar,
            role: 'user',
            accountType: 'personal',
            oauthProviders: ['facebook'],
          });

          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}
