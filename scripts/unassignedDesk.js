require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const axios = require('axios');
const FormData = require('form-data');

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

const sendUnassignedDeskTickets = async () => {
  try {
    console.log("MAIN");
    const unassignedTickets = await getUnassignedDeskTickets();
    // console.log(unassignedTickets);
    const filteredTickets = removeAssignedTickets(unassignedTickets);
    console.log('Filtered Tickets');
    console.log(filteredTickets);
    message = generateUnassignedTicketsMessage(filteredTickets);
    return message;
  } catch (err) {
    console.log(err);
  }
}

const generateUnassignedTicketsMessage = (unassignedTickets) => {
  let unassignedTicketsText = "";
  unassignedTickets.map(ticket => {
    let name = ticket['subject'];
    let link = "https://jaladesign.teamwork.com/desk/tickets/" + ticket['id'] + "/messages";
    unassignedTicketsText += "*UNASSIGNED:* " + name + " | *Link*:_ " + link + " _\n\n";
  })
  return unassignedTicketsText;
}
//  sendUnassignedDeskTickets();
(async () => {
  const message = await sendUnassignedDeskTickets();
  console.log(message);
  try {
    await client.chat.postMessage({
      channel: slackChannelId,
      text: message,
      parse: 'full'
    });
    console.log('Message sent!');
  } catch (error) {
    console.error(error);
  }
})();