require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const { sequelize } = require('./models');
const initSockets = require('./sockets');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const boardRoutes = require('./routes/board.routes');
const taskRoutes = require('./routes/task.routes');
const commentRoutes = require('./routes/comment.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();
const server = http.createServer(app);

// CLIENT_URL only matters if you ever split the frontend out to its own
// origin again (e.g. local dev with two dev servers). For the combined
// single-service deployment this app ships with, the frontend is served
// from this same origin, so CORS isn't in play for normal browser use.
const clientUrl = process.env.CLIENT_URL || true;

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Makes the socket server reachable from any controller via req.app.get('io')
app.set('io', io);

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Serve the built frontend (single-service deployment) ---
// `npm run build` (see root package.json) builds the React app into
// frontend/dist. Express serves those static assets, and any non-API GET
// request falls back to index.html so React Router can handle client-side
// routes like /projects/:id directly.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Central error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

initSockets(io);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.sync();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };
