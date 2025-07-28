// server/config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../src/models/User.js'; // Adjust path if needed

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'], // Request user's profile and email
    passReqToCallback: true // Allows us to access req in callback
},
async (request, accessToken, refreshToken, profile, done) => {
    try {
        // Log both profile.id and profile.emails[0].value for debugging
        console.log("Passport Google Strategy Callback Initiated for:", profile?.id, profile?.emails?.[0]?.value);
        // Find user by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            console.log("User found by Google ID:", user.username);
            // If user exists, return them
            return done(null, user);
        }

        // If not found by Google ID, try finding by email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            console.log("User found by email, linking Google ID:", user.username);
            // If user exists with this email but no Google ID, link it
            user.googleId = profile.id;
            await user.save({ validateBeforeSave: false }); // Don't validate password here
            return done(null, user);
        }

        // If no user found by Google ID or email, create a new user
        console.log("Creating new user from Google profile:", profile.emails[0].value);
        const newUser = new User({
            googleId: profile.id,
            username: profile.displayName.replace(/\s/g, '').toLowerCase() + Math.floor(Math.random() * 1000), // Generate unique username
            fullName: profile.displayName,
            email: profile.emails[0].value,
            profilePicture: profile.photos[0].value, // Use Google profile picture
            // password: undefined, // No local password for OAuth user, or generate a random one
            // role will default to 'user'
            // status will default to 'user_active'
        });

        await newUser.save();
        console.log("New user created successfully:", newUser.username);
        return done(null, newUser);

    } catch (error) {
        console.error("Passport Google Strategy Error:", error);
        return done(error, false); // Pass error to Passport
    }
}));

// Serialize user into the session (not typically needed for JWT, but Passport requires it)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, false);
    }
});