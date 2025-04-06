const LocalStrategy = require('passport-local').Strategy;
const { Admin } = require('../models'); // Use the index import

function initialize(passport) {
  const authenticateUser = async (username, password, done) => {
    try {
      const admin = await Admin.findOne({ where: { username: username } });
      if (!admin) {
        // Timing attack prevention: use similar processing time whether user exists or not
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
        return done(null, false, { message: 'Incorrect username or password.' });
      }

      // Use the instance method from the Admin model
      if (admin.validPassword(password)) {
        return done(null, admin); // Authentication successful
      } else {
        return done(null, false, { message: 'Incorrect username or password.' });
      }
    } catch (error) {
      return done(error); // Pass errors to Passport
    }
  };

  passport.use(new LocalStrategy({ usernameField: 'username' }, authenticateUser));

  // Store user ID in session
  passport.serializeUser((admin, done) => done(null, admin.id));

  // Retrieve user from session using ID
  passport.deserializeUser(async (id, done) => {
    try {
      const admin = await Admin.findByPk(id);
      done(null, admin); // Make admin object available as req.user
    } catch (error) {
      done(error);
    }
  });
}

module.exports = initialize;
