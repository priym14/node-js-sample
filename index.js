var express = require('express')
var app = express()

const client = require('prom-client'); //Metrics collection prometheus


app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({register: client.register})

app.get('/', function(request, response) {
  response.send('Hello World!')
})

// Expose /metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
}); 

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
