/// <reference path="typings/rx/rx" />
/// <reference path="typings/ws/ws" />


import Rx = require('rx');
import RxNode = require('rx-node');
import Fetch = require('node-fetch');
import ws = require('ws');

const getSlackUrl = (method, token) => `https://slack.com/api/${method}?token=${token}`

const getBotUrl = (slackDetails) => {
    console.log(slackDetails.url);
    return slackDetails.url
}
    

const startConnection = (token) => {
    return Rx.Observable
        .fromPromise(Fetch(getSlackUrl('rtm.start', token)))
        .flatMap((res) => res.json())
        .map(getBotUrl);
}

const createSlackSocket = (url, openObserver?:Rx.Observer<any>, closeObserver?:Rx.Observer<any>) => {
    //create socket
    const socket = new ws(url);
    
    //handler for connection opening
    const openHandler = (event) => {
        openObserver.onNext(event);
        openObserver.onCompleted();
        socket.removeListener('open', openHandler);
    }
    
    //incoming messages 
    const messageStream = Rx.Observable.create((gen) => {
        
        const messageHandler = (message) => gen.onNext(message.data);
        const errorHandler = (error) => gen.onError(error);
        const closeHandler = (event) => gen.onCompleted();
        
        openObserver && socket.addEventListener('open',openHandler);
        
        socket.addEventListener('message', messageHandler);
        socket.addEventListener('error',errorHandler);
        socket.addEventListener('close',closeHandler);
        
        return () => {
            socket.removeListener('message',messageHandler);
            socket.removeListener('error',errorHandler);
            socket.removeListener('close',closeHandler);
        }
        
    });
    
    const responseStream = Rx.Observer.create((message) => {
        socket.send(message);
    })
    
    return Rx.Subject.create(responseStream, messageStream);
}

let slackStream = startConnection(process.env.SLACK_TOKEN)
  .flatMap(createSlackSocket)
  
  slackStream.subscribe((ev) => {
      console.log(ev)
  })