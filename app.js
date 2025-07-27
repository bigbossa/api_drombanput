const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://domini-vercel.vercel.app','http://localhost:8080'],
  methods: ['GET', 'POST', 'PUT']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve โฟลเดอร์ images
app.use("/file", express.static(path.join(__dirname, "file")));

const routes = require('./routes/server');
app.use('/server', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express Serverless!' });
});

module.exports = app;
module.exports.handler = serverless(app);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
