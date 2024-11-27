// LICENSE: GNU GPL v3 You should have received a copy of the GNU General
// Public License along with this program. If not, see
// https://www.gnu.org/licenses/.

// File: test-server.mjs
// Provides an example of how the Fregeifier router can be mounted in an
// expressJS webApp; can also be used for testing

import express from 'express';
import http from 'node:http';
import fregeifierRouter from './fregeifierRouter.mjs';

const app = express();

// mount router
app.use(fregeifierRouter);

// catch 404
app.use(function (req, res, next) {
  res.status(404).type('txt').send('Error 404 Not Found');
});

// catch other errors
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).type('txt').send('Error 500 Server Error: ' + err.toString());
});

// disable X-Powered-By header to avoid attacks targeting Express
app.disable('x-powered-by');

// create and start server
let httpserver = http.createServer(app);
let portnum = parseInt(process.env.FREGEIFIERTESTSERVERPORT);
if (isNaN(portnum)) portnum = 10791;
httpserver.listen(portnum);

// report errors
httpserver.on('error', onError);

// report listening to stderr
httpserver.on('listening', () => {
  const addr = httpserver.address();
  console.log('HTTP server listening on port ' + addr.port.toString());
});

// shutdown gracefully if terminated
httpserver.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  httpserver.close(() => {
    console.log('http server closed')
  });
});

// handle specific listen errors with friendly messages
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  switch (error.code) {
    case 'EACCES':
      console.error('ERROR: Port requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error('ERROR: Port is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
