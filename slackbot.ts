import {SlackSocket} from './lib/SlackSocket'

console.log(SlackSocket)


let connectionStream = SlackSocket.create(process.env.SLACK_TOKEN);

let slackSocket;

let botMessageStream = connectionStream
  .flatMap((socket) => {
    slackSocket = socket;
    return socket.mentions;
  })
  .forEach((message) => {
    console.log('message',message)
    slackSocket.send({
      id: 1,
      type: 'message',
      channel: message.channel,
      text: 'hello world'
    })
  })
  


