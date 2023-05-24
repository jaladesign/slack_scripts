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

const grabDeskEmployees = async () => {
    let data = new FormData();

    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://jaladesign.teamwork.com/desk/api/v2/users.json',
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
        let responseUsers = responseData['users'];
        return responseUsers;
      } catch(err){
        console.log(err);
        return false;
    }
}

const findEmployeeId = async (employeeName, employees) => {
    return employees.find(employee => employee.firstName === employeeName || employee.lastName === employeeName);
}

const getAssignedDeskTickets = async (employeeId) => {
    let data = new FormData();
    /*
    Status:
    1 = Active
    3 = Waiting on customer
    4 = On hold
    5 = Solved 
    6 = Closed
    */
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://jaladesign.teamwork.com/desk/api/v2/tickets.json?filter={"agent":' + employeeId + ', "status":1}',
        // url: 'https://jaladesign.teamwork.com/desk/api/v2/tickets.json?filter={"agent":' + employeeId + '}',
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
        return responseData['tickets'];
      } catch(err){
        console.log(err);
        return false;
    }
}

const sendAssignedDeskTickets = async (employee) => {
  try {
    console.log("MAIN");
    const employeeId = employee['id'];
    const assignedTickets = await getAssignedDeskTickets(employeeId);
    let message = generateAssignedTicketsMessage(assignedTickets, employee);
    return message;
  } catch (err) {
    console.log(err);
  }
}

const generateAssignedTicketsMessage = (assignedTickets, employee) => {
    console.log("assignedTickets");
    console.log(assignedTickets);
    const employeeName = employee['firstName'] + " " + employee['lastName'];

    if (assignedTickets.length === 0) return "There are no active desk tickets for " + employeeName + "!";

    let assignedTicketsText = "*Assigned Tickets:* \n";
    assignedTickets.map(ticket => {
        let name = ticket['subject'];
        let link = "https://jaladesign.teamwork.com/desk/tickets/" + ticket['id'] + "/messages";
        assignedTicketsText += "*" + employeeName + ":* " + name + " | *Link*:_ " + link + " _\n\n";
    });
    return assignedTicketsText;
}



(async () => {
    const employeeName = process.argv[2];
    console.log(`Employee Name: ${employeeName}`);
    const employees = await grabDeskEmployees();
    let employee = await findEmployeeId(employeeName, employees);
    const message = await sendAssignedDeskTickets(employee);

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