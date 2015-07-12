import {SlackSocket} from './lib/SlackSocket';
import es6shim = require('es6-shim');

(es6shim)

console.log('starting slackbot...', process.env.SLACK_TOKEN);


let connectionStream = SlackSocket.create(process.env.SLACK_TOKEN);

let commands = {};

let slackSocket;

var count = 1;
let messageStream = connectionStream
  .flatMap((socket) => {
    console.log('opened connection...')
    slackSocket = socket;
    return socket.messages.map((message) => ({
      reply(text, mention){
        socket.send({
          type: 'message',
          channel: message.channel,
          text: `<@${mention || message.user}>: ${text}`,
          id: count++
        });
      },
      message
    }))
  });
  
let commandStream = messageStream.filter((event) => event.message.text.startsWith("!")).publish();
  
 
let rememberCommandStream = commandStream.filter((event) => event.message.text.startsWith("!remember ")); 

let execCommandStream = commandStream.filter((event) => {
  var valid = !event.message.text.startsWith("!remember ");
  console.log(valid);
  return valid;
});

rememberCommandStream.subscribe((event) => {
  let [remember, name, ...text] = event.message.text.split(" ");
  
  if(commands[name]){
    event.reply('I already know about that :(');
    return;
  }
  
  commands[name] = text.join(' ');
  event.reply(`OK, i'll remember that ${name} means '${commands[name]}'`);
  
});


execCommandStream.subscribe((event) => {
  console.log('command',event)
  let [command, mention] = event.message.text.split(" ");
  command = command.slice(1);
  if(!commands[command]){
    event.reply(`I don't know anything about that, sorry :( `);
    return;
  }
  event.reply(commands[command],mention);
})

commandStream.connect();
 



