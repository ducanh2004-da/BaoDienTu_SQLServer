const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');

passport.use(new LocalStrategy(
    { usernameField: 'email' },
    (email, password, done) => {
        User.findByEmail(email, (err, user) => {
            if (err) return done(err);
            if (!user) {
                return done(null, false, { message: 'Email not registered' });
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) return done(err);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password' });
                }
            });
        });
    }
));

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
        User.findByGoogleId(profile.id, (err, user) => {
            if (err) return done(err);
            if (!user) {
                // Nếu người dùng chưa có trong cơ sở dữ liệu, tạo người dùng mới
                const newUser = {
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: 'subscriber', // Gán role mặc định nếu bạn muốn
                };
                User.add(newUser, (err, createdUser) => {
                    if (err) return done(err);
                    return done(null, createdUser);
                });
            } else {
                return done(null, user);
            }
        });
    })
);

passport.use(
    new GithubStrategy({
        clientID: process.env.GITHUB_APP_ID,
        clientSecret: process.env.GITHUB_APP_SECRET,
        callbackURL: '/api/github/callback',
    },
    (accessToken, refreshToken, profile, done) => {
        User.findByGithubId(profile.id, (err, user) => {
            if (err) return done(err);
            if (!user) {
                // Nếu người dùng chưa có trong cơ sở dữ liệu, tạo người dùng mới
                const newUser = {
                    username: profile.displayName,
                    email: profile.emails[0].value,
                    githubId: profile.id,
                    role: 'subscriber', // Gán role mặc định nếu bạn muốn
                };
                User.add(newUser, (err, createdUser) => {
                    if (err) return done(err);
                    return done(null, createdUser);
                });
            } else {
                return done(null, user);
            }
        });
    })
);

passport.serializeUser((user, done) => {
    if (!user || !user.id) {
        console.error('Tạo tài khoản thành công, trở về lại form và đăng nhập băng google lần nữa thử xem:', user);
        return done(new Error('Tạo tài khoản thành công, trở về lại form đăng nhập băng google thử xem'));
    }
    console.log('Serializing user:', user);
    done(null, user.id); // Sử dụng `user.id` làm khóa session
});

passport.deserializeUser((id, done) => {
    // User.findById(id, (err, user) => done(err, user));
    User.findById(id, (err, user) => {
        if (err) {
            console.error('Error deserializing user:', err);
            return done(err);
        }
        if (!user) {
            console.error('User not found during deserialization');
            return done(new Error('User not found'));
        }
        console.log('Deserialized user:', user);
        done(null, user);
    });
});

module.exports = passport;