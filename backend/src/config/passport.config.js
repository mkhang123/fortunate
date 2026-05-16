import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './prisma.js';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:4000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName;
                const avatar = profile.photos?.[0]?.value;
                const googleId = profile.id;

                if (!email) {
                    return done(new Error('Tài khoản Google không có email'), null);
                }
                let user = await prisma.user.findFirst({
                    where: {
                        OR: [{ googleId }, { email }],
                    },
                });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                            email,
                            name,
                            avatar,
                            googleId,
                            password: null,
                        },
                    });
                } else if (!user.googleId) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { googleId, avatar: user.avatar || avatar },
                    });
                }

                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

export default passport;
