const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { socketAuthMiddleware, setupSocketHandlers } = require('./config/socket');

// Load .env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security Middleware
app.use(helmet()); // Adds security headers
app.use(cors()); // Enable CORS for all routes
app.use(apiLimiter); // Rate limiting

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Static file serving for uploaded images
app.use('/uploads', express.static('uploads'));

// This new line tells the server to use our user routes
app.use('/api/users', require('./routes/userRoutes'));

// This new line tells the server to use our habit routes
app.use('/api/habits', require('./routes/habitRoutes'));
// This new line tells the server to use habit log routes
app.use('/api/logs', require('./routes/habitLogRoutes'));

// This new line tells the server to use our profile routes
app.use('/api/profile', require('./routes/profileRoutes'));

// Group routes
app.use('/api/groups', require('./routes/groupRoutes'));

// Message routes
app.use('/api/messages', require('./routes/messageRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Setup Socket.IO authentication and event handlers
io.use(socketAuthMiddleware);
setupSocketHandlers(io);

// Error Handling Middleware (Must be last)
app.use(notFound); // 404 handler
app.use(errorHandler); // General error handler

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO ready for connections`);
  });
}

module.exports = { app, server, io };
