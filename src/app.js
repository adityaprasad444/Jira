const express = require('express');
const path = require('path');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const timeLogsRouter = require('./routes/timeLogs');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/time-logs', timeLogsRouter);

// Serve static files from React build (optional, for production)
// app.use(express.static(path.join(__dirname, '../build')));

module.exports = app; 