const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./scripts/routes');

const app = express();
const port = 8000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('./scripts/unassignedDesk');

// Use the routes middleware
app.use('/', routes);

app.get('/', (req, res) => {
  res.send('Hello, this is the root page 123!');
});


//Note: /unassigneddesk is unseen in this file. Look into how to use other files app.get/posts.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});