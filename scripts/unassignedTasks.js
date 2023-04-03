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

const getUnassignedTeamworkTasks = async () => {
  let data = new FormData();
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://jaladesign.teamwork.com/tasks.json?responsible-party-ids=0',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Basic dHdwXzhZWktuVFVIVU9yRXM4QkZuYTV3aEU4cmxlbGw6ag==', 
      'Cookie': 'JSESSIONID=DC423319A408FC9750B372B39025EAE2.cfusion; PROJLB=k12|ZCUFJ|ZCUE4; RDS=2; tw-auth=tw-4C18EC18AA615CC6EEC54A4D59680A29-3rIX07NSKA9oNgwc8zilB1ZhtHcqZL-431930', 
      ...data.getHeaders()
    },
    data : data
  };

  try {
    const response = await axios(config);
    const responseData = response.data;
    let responseTasks = responseData['todo-items'];
    return responseTasks;
  } catch(err){
    console.log(err);
    return false;
  }

}

const removeDesignTasks = (unassignedTasks) => {
  let filteredArray = [];
  unassignedTasks.map(task => {
    if (
      !task['project-name'].includes("Website Design") &&
      !task['project-name'].includes("Strategy") &&
      !task['company-name'].includes("Jala Design") &&
      !task['todo-list-name'].includes("Planning")
      ){
      let tags = task['tags'];
      let isOnHoldTagPresent = false;
      if (tags){
        const onHoldOptions = ["On Hold", "On Hold - Awaiting Approval (NB)"];
        isOnHoldTagPresent = tags.some(tag => onHoldOptions.some(opt => tag.name.includes(opt)));
      }
      //  If no "On Hold" tag then add to array
      if (!isOnHoldTagPresent) {
          filteredArray.push(task);
      }
    }
  })
  return filteredArray;
}

const sendUnassignedTeamworkTasks = async () => {
  try {
    console.log("MAIN");
    const unassignedTasks = await getUnassignedTeamworkTasks();
    const filteredTasks = removeDesignTasks(unassignedTasks);
    message = generateUnassignedTasksMessage(filteredTasks);
    console.log(message);
    return message;
    // const twTasks = await getTeamworkTasks();
    // const filterType = "Unassigned";
    // const unassignedTasks = filterTwTasks(twTasks, filterType);
  } catch (err) {
    console.log(err);
  }
}

const generateUnassignedTasksMessage = (unassignedTasks) => {
  // console.log(unassignedTasks);
  let unassignedTasksText = "*Unassigned Tasks:* \n";
  unassignedTasks.map(task => {
    let name = task['content'];
    let companyName = task['company-name'];
    let link = "https://jaladesign.teamwork.com/app/tasks/" + task['id'];
    unassignedTasksText += "*UNASSIGNED:* " + companyName + " - " + name + " | *Link*: " + link + "\n";
    // console.log("Unasssigned: " + companyName + " - " + name + " | Link: " + link);
  })
  return unassignedTasksText;
}


(async () => {
  const message = await sendUnassignedTeamworkTasks();
  try {
    await client.chat.postMessage({
      channel: slackChannelId,
      text: message
    });
    console.log('Message sent!');
  } catch (error) {
    console.error(error);
  }
})();