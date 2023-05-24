const express = require('express');
const router = express.Router();
const unassignedDeskRouter = require('./unassignedDesk');

// Define the /unassigneddesk endpoint
router.use('/unassigneddesk', unassignedDeskRouter);

// Export the router
module.exports = router;