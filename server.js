// server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const SequelizeStore = require('connect-session-sequelize')(session.Store); // RE-ENABLE THIS

const sequelize = require('./config/database');
const configurePassport = require('./config/passport-config');
const flash = require('connect-flash');
require('./models'); // Ensure models are loaded
const { Admin } = require('./models');

// Import routes
const indexRoutes = require('./routes/index');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Passport
configurePassport(passport);

// Database session store setup - RE-ENABLE
const sessionStore = new SequelizeStore({
  db: sequelize,
  // Optional: Check session expiration interval automatically (removes expired sessions)
  // checkExpirationInterval: 15 * 60 * 1000, // every 15 minutes in ms
  // expiration: 24 * 60 * 60 * 1000  // Sessions expire after 24 hours in ms
});

// Middleware setup (remains largely the same)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware - Use the SequelizeStore
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore, // USE THE PERSISTENT STORE
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: process.env.NODE_ENV === 'production', // Enable in production with HTTPS
      // httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // Example: 1 day validity
    },
  })
);
// sessionStore.sync(); // Sync the session table (can be done below with main sync)

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.currentUser = req.user;
  // Make flash messages available in all views under 'messages'
  res.locals.success_msg = req.flash('success_msg'); // Example success message key
  res.locals.error_msg = req.flash('error_msg'); // Example error message key
  // Passport's failureFlash uses 'error' by default
  res.locals.error = req.flash('error');
  next();
});

// Mount Routes
app.use('/', indexRoutes);
app.use('/events', eventRoutes);
app.use('/admin', adminRoutes);

// 404 and Error Handlers (remain the same)
app.use((req, res, next) => {
  res.status(404).render('404', { pageTitle: 'Page Not Found' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).render('error', {
    pageTitle: 'Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message,
    error: process.env.NODE_ENV === 'production' ? {} : err,
  });
});

// Database Connection and Server Start
sequelize
  .authenticate()
  .then(() => {
    console.log('SQLite file database connection authenticated successfully.');
    // Sync models. REMOVE force:true. Use alter:true WITH CAUTION during dev if needed.
    // For production, rely on migrations (using sequelize-cli).
    // return sequelize.sync({ alter: true }); // Example for dev schema alterations
    return sequelize.sync(); // Safest option, creates tables if they don't exist
  })
  .then(() => {
    // Also sync the session table AFTER main tables are synced/created
    return sessionStore.sync();
  })
  .then(() => {
    console.log(
      'Database synchronized (tables created/verified in database.sqlite).'
    );
    console.log('Session table synchronized.');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('Using SQLite file database (persistent).');

      if (process.env.NODE_ENV === 'development') {
        Admin.findOrCreate({
          where: { username: 'admin' },
          defaults: { password: 'admin' }, // Password will be hashed by hook
        })
          .then(([admin, created]) => {
            if (created) {
              console.log(
                "Default admin user 'admin' (pw: 'password') created in persistent DB."
              );
            } else {
               console.log("Default admin user 'admin' already exists."); // Optional log
            }
          })
          .catch((err) =>
            console.error('Error finding/creating default admin:', err)
          );
      }
    });
  })
  .catch((err) => {
    console.error('Unable to connect/sync the database or start server:', err);
    process.exit(1);
  });

module.exports = app;
