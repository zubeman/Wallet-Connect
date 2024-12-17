require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const csurf = require('csurf');
const helmet = require('helmet'); // Added for security headers
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const { errorHandler } = require('./utils/errorHandler');
const http = require('http'); // For WebSocket server
const { Server } = require('socket.io'); // WebSocket support

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const dbConfig = require('./config/db.config');

// Middleware
app.use(morgan('combined')); // Logging
app.use(helmet()); // Security headers
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
  cookie: { 
    secure: 'auto', // Use 'auto' for Vercel's HTTPS detection
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour session
  }
}));

// Serve static files from the views directory
app.use(express.static(path.join(__dirname, '../views')));

// Define routes to serve views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

// CSRF Protection
app.use(csurf({ cookie: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);

// WebSocket server setup for real-time functionality
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A user connected via WebSocket');
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  // Example event for checking wallet status
  socket.on('checkStatus', async (userId) => {
    try {
      const walletStatus = await require('./controllers/authController').getWalletStatus(userId);
      socket.emit('statusUpdate', walletStatus);
    } catch (error) {
      console.error('Error in checkStatus:', error);
      socket.emit('statusUpdate', { error: 'Failed to check status' });
    }
  });

  // Additional WebSocket event handlers can be added here
});

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
