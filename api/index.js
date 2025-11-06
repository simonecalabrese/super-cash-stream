const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { PassThrough } = require('stream');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/hourly_cash_per_shop', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // send headers immediately
  // Optional (?) message to keepalive the connection.
  res.write(': connected\n\n');

  axios.post('http://localhost:8088/query', {
    ksql: "SELECT * FROM hourly_cash_per_shop EMIT CHANGES;",
    streamsProperties: {}
  }, {
    headers: {
      'Content-Type': 'application/vnd.ksql.v1+json; charset=utf-8'
    },
    responseType: 'stream'
  })
    .then((response) => {
      response.data.on('data', (chunk) => {
        const text = chunk.toString().trim();
        // Some chunks are newlines or metadata, skip them
        if (!text || text === '\n') return;
        // NOTE: Each chunk may contain one or more JSON objects separated by newlines
        const lines = text.split('\n')
        for (let line of lines) {
          try {
            // Remove the final comma char
            if (line[line.length - 1] == ',')
              line = line.slice(0, -1)
            const json = JSON.parse(line);
            // Send valid SSE message
            res.write(`data: ${JSON.stringify(json)}\n\n`);
          } catch (err) {
            // If invalid JSON skip chunk
            console.error('Bad chunk:', line);
          }
        }
      });
      response.data.on('end', () => {
        console.log('KSQL stream ended');
        res.write('event: end\ndata: Stream ended\n\n');
        res.end();
      });
    })
    .catch((error) => {
      console.error('Error with ksqlDB stream:', error.message);
      res.write(`event: error\ndata: ${error.message}\n\n`);
      res.end();
    });
});

app.listen(PORT, () => {
  console.log(`Express server listening on http://localhost:${PORT}`);
});
