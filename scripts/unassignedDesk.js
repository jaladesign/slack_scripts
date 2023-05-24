require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const router = express.Router();


const slackApiToken = process.env.SLACK_TOKEN;
const slackChannelId = process.env.SLACK_TESTING_CHANNEL;
// const slackChannelId = process.env.SLACK_ALERTS_GENERAL_CHANNEL;

console.log(`slackApiToken: ${slackApiToken}`);
console.log(`slackChannelId: ${slackChannelId}`);

const client = new WebClient(slackApiToken);

const getUnassignedDeskTickets = async () => {
    let data = new FormData();

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://jaladesign.teamwork.com/desk/api/v2/tickets.json?filter={"status":1}',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer tkn.v1_OGEwYTUyNDYtY2FlOC00M2JjLTgwMjQtYjQ3NmQ2ZTI4MTM5LTMzNDUxMC40MzE5MzAuVVM=', 
          'Cookie': 'tw-auth=tw-4C18EC18AA615CC6EEC54A4D59680A29-3rIX07NSKA9oNgwc8zilB1ZhtHcqZL-431930', 
          ...data.getHeaders()
        },
        data : data
      };

    try {
        const response = await axios(config);
        const responseData = response.data;
        let responseTasks = responseData['tickets'];
        return responseTasks;
      } catch(err){
        console.log(err);
        return false;
    }
}

const removeAssignedTickets = (unassignedTickets) => {
  let filteredArray = [];
  unassignedTickets.map(ticket => {
    if (!ticket.hasOwnProperty('agent') && !Array.isArray(ticket.hobbies)){
        // console.log("");
        filteredArray.push(ticket);
    }
  });
  return filteredArray;
}

// const sendUnassignedDeskTickets = async () => {
//   try {
//     console.log("MAIN");
//     const unassignedTickets = await getUnassignedDeskTickets();
//     // console.log(unassignedTickets);
//     const filteredTickets = removeAssignedTickets(unassignedTickets);
//     // console.log('Filtered Tickets');
//     // console.log(filteredTickets);
//     let message = generateUnassignedTicketsMessage(filteredTickets);
//     console.log("message");
//     console.log(message);
//     return message;
//   } catch (err) {
//     console.log(err);
//   }
// }

const generateUnassignedTicketsMessage = (unassignedTickets) => {
  let unassignedTicketsText = "*Unassigned Tickets:* \n";
  unassignedTickets.map(ticket => {
    let name = ticket['subject'];
    let link = "https://jaladesign.teamwork.com/desk/tickets/" + ticket['id'] + "/messages";
    unassignedTicketsText += "*UNASSIGNED:* " + name + " | *Link*:_ " + link + " _\n\n";
  });
  return unassignedTicketsText;
}

// router.get('/unassigneddesk', async (req, res) => {
//   try {
//     // console.log("MAIN");
//     // const unassignedTickets = await getUnassignedDeskTickets();
//     // const filteredTickets = removeAssignedTickets(unassignedTickets);
//     // const message = generateUnassignedTicketsMessage(filteredTickets);
//     // console.log("message");
//     // console.log(message);
    
//     // // Send the message to Slack
//     // await client.chat.postMessage({
//     //   channel: slackChannelId,
//     //   text: message,
//     //   parse: 'full'
//     // });
    
//     // console.log('Message sent!');
//     res.send('Unassigned Desk message sent!');
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error occurred while sending the Unassigned Desk message.');
//   }
// });

// app.get('/unassigneddesk', (req, res) => {
//   // Parse the slash command payload
//   const command = req.body.command;
//   const text = req.body.text;
//   // (async () => {
//   //   const message = await sendUnassignedDeskTickets();
//   //   console.log(message);
//   //   try {
//   //     await client.chat.postMessage({
//   //       channel: slackChannelId,
//   //       text: message,
//   //       parse: 'full'
//   //     });
//   //     console.log('Message sent!');
//   //   } catch (error) {
//   //     console.error(error);
//   //     console.error("BIG ERROR");
//   //   }
//   // })();
//   // Format the response message
//   const response = "UNASSINGED TICKETS";
//   console.log("UDesk");
//   // Send the response back to Slack
//   // res.json({ text: response });
//   res.send('Hello, this is the Unassigned Desk!');
// });


router.get('/', async (req, res) => {
   try {
    console.log("MAIN");
    const unassignedTickets = await getUnassignedDeskTickets();
    const filteredTickets = removeAssignedTickets(unassignedTickets);
    const message = generateUnassignedTicketsMessage(filteredTickets);
    console.log("message");
    console.log(message);
    
    // Send the message to Slack
    await client.chat.postMessage({
      channel: slackChannelId,
      text: message,
      parse: 'full'
    });
    
    console.log('Message sent!');
    res.send('Unassigned Desk message sent!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error occurred while sending the Unassigned Desk message.');
  }
});

module.exports = router;
