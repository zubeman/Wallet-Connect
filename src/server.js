require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const csurf = require('csurf');
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const { errorHandler } = require('./utils/errorHandler');

const app = express();
const dbConfig = require('./config/db.config');

// Middleware
app.use(morgan('combined')); // Logging
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Management
const sessionStore = new MySQLStore(dbConfig);
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { secure: true, httpOnly: true, sameSite: 'strict', maxAge: 3600000 } // 1 hour session
}));

// CSRF Protection
app.use(csurf({ cookie: true }));

// Routes
app.use('/', authRoutes);
app.use('/', walletRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
