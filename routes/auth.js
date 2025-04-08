// import express from "express";
const express = require('express');
const passport = require('passport');
const { validatePost } = require('../validators/validators');

const router = express.Router();
const AuthController = require('../controllers/auth');

router.get('/',AuthController.showForm);
router.post('/register',validatePost,AuthController.Register);
router.post('/login',validatePost,AuthController.Login);
router.post('/login-writer',validatePost,AuthController.LoginWriter);
router.post('/login-editor',validatePost,AuthController.LoginEditor);
router.post('/login-admin',validatePost,AuthController.LoginAdmin);
// Google Auth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/api' }),
    (req, res) => {
        req.session.user = req.user; // Store user info in session
        const role = req.user.role;  // Get user role
        // Redirect based on role
        redirectUserByRole(role, res);
    });
// github Auth
router.get('/github', passport.authenticate('github', { scope: ['email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.user = req.user; // Store user info in session
        const role = req.user.role;  // Get user role
        // Redirect based on role
        redirectUserByRole(role, res);
    });

// Helper function for redirecting users based on role
function redirectUserByRole(role, res) {
    switch (role) {
        case 'admin':
            return res.redirect('/admin');
        case 'editor':
            return res.redirect('/editor');
        case 'writer':
            return res.redirect('/writer');
        default:
            return res.redirect('/main'); // Default route if role is unknown
    }
}


//OTP
router.route('/forgot-password')
    .get(AuthController.showForgotForm)
    .post(AuthController.sendOtp)

router.route('/reset-password')
    .get(AuthController.showResetForm)
    .post(AuthController.resetPass)

router.route('/verify-otp')
    .get((req,res) => {
        res.render('checkOtp');
        })
    .post(AuthController.checkOtp)

router.get('/logout', AuthController.Logout);

module.exports = router;