// Global error logging for uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.stack || err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason.stack || reason);
});
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const connectDB = require("./config/dbconnection");
const cors = require("cors");
const fileUpload = require('express-fileupload');

require("dotenv").config();
connectDB();



const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');
const ownerRouter = require('./routes/owner');
const listingRouter = require('./routes/listing');
const messagesRouter = require('./routes/messages');
const connectionsRouter = require('./routes/connections');

console.log('Importing matches router...');
const matchesRouter = require('./routes/matches');
console.log('Matches router imported successfully');


var app = express();

// CORS configuration must come before other middleware
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // Set Access-Control-Allow-Origin to the request's origin
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));

// Enable pre-flight for all routes
app.options('*', cors());

// Debug middleware for all requests
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));

// Apply routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter); // This will make GET /api/users available
app.use('/api/rooms', roomsRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/listings', listingRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/connections', connectionsRouter);
console.log('🚀 Registering matches routes...');
app.use('/api/matches', matchesRouter);
console.log('✅ Matches routes registered');

// List all registered routes for debugging
console.log('Registered routes:');
app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
        console.log("🛣️ Route:", r.route.stack[0].method.toUpperCase(), r.route.path);
    } else if(r.name === 'router'){
        console.log("📁 Router middleware:", r.regexp);
    }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    console.log('⚠️ 404 Not Found:', req.method, req.path);
    res.status(404).json({
        status: 'error',
        message: `Cannot ${req.method} ${req.path}`,
        debug: {
            method: req.method,
            path: req.path,
            baseUrl: req.baseUrl,
            originalUrl: req.originalUrl
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        debug: {
            method: req.method,
            path: req.path,
            error: err.stack
        }
    });
});

module.exports = app;
