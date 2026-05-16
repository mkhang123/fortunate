import express from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken); 
router.post('/logout', authController.logout);          
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed` }),
    authController.googleCallback
);

export default router;