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
const http = require('http');
const { Server } = require('socket.io');

require("dotenv").config();
connectDB();

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const roomsRouter = require('./routes/rooms');
const ownerRouter = require('./routes/owner');
const listingRouter = require('./routes/listing');
const messagesRouter = require('./routes/messages');
const connectionsRouter = require('./routes/connections');
const matchesRouter = require('./routes/matches');

const app = express();

// ----------------- CORS -----------------
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      FRONTEND_URL
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','Accept','Origin','X-Requested-With']
}));

app.options('*', cors()); // pre-flight

// Debug middleware
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
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp/" }));

// ----------------- Routes -----------------
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/listings', listingRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/matches', matchesRouter);

// ----------------- Debug: list all routes -----------------
console.log('Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log("🛣️ Route:", r.route.stack[0].method.toUpperCase(), r.route.path);
  } else if (r.name === 'router') {
    console.log("📁 Router middleware:", r.regexp);
  }
});

// ----------------- 404 Handler -----------------
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

// ----------------- Error Handler -----------------
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

// ----------------- Socket.io -----------------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET","POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Socket disconnected:', socket.id);
  });
});

// ----------------- Start server -----------------
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
