const express = require('express');
const client = require('prom-client');
const os = require('os');

const app = express();
app.set('port', process.env.PORT || 5000);
app.use(express.static(__dirname + '/public'));

// Enable default metrics collection
client.collectDefaultMetrics({ register: client.register });

// Custom Metrics

// 1. HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// 2. Request latency histogram
const requestLatency = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request latency in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5], // latency buckets
});

// 3. HTTP error counter
const errorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['route', 'status_code'],
});

// 4. Active user gauge (mock example)
const activeUsers = new client.Gauge({
  name: 'active_users',
  help: 'Current number of active users',
});

// 5. Disk usage gauge (mock using memory as example)
const diskUsage = new client.Gauge({
  name: 'disk_space_used_bytes',
  help: 'Mocked disk usage in bytes (using memory usage)',
});

function updateDiskUsage() {
  const used = os.totalmem() - os.freemem(); // mock
  diskUsage.set(used);
}
setInterval(updateDiskUsage, 5000); // update every 5s

// Middleware to record metrics for each request
app.use((req, res, next) => {
  const end = requestLatency.startTimer();
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });

    if (res.statusCode >= 400) {
      errorCounter.inc({
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      });
    }

    end({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Simulate login/logout
app.get('/login', (req, res) => {
  activeUsers.inc();
  res.send('User logged in');
});

app.get('/logout', (req, res) => {
  activeUsers.dec();
  res.send('User logged out');
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// Start server
app.listen(app.get('port'), () => {
  console.log('Node app is running at http://localhost:' + app.get('port'));
});
