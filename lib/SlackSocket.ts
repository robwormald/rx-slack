/// <reference path="typings/rx/rx" />
/// <reference path="typings/ws/ws" />


import Rx = require('rx');
import RxNode = require('rx-node');
import Fetch = require('node-fetch');
import ws = require('ws');

//slack events

interface SlackEvent {
    type: string;
    user?:string;
    message?:string;
    data?:any;
}
const EV_USER_TYPING = 'user_typing';
const EV_MESSAGE = 'message';
const EV_HELLO = 'hello';

const isMessage = (event) => event.type === EV_MESSAGE;

const getSlackUrl = (method, token) => `https://slack.com/api/${method}?token=${token}`

export class SlackSocket {
    connectionData: any;
    messages: Rx.Observable<SlackEvent>;
    _subject: Rx.Subject<SlackEvent|SlackEvent>
    
    static create(token, openObserver?, closeObserver?){
        return Rx.Observable
        .fromPromise(Fetch(getSlackUrl('rtm.start', token)))
        .flatMap((res) => res.json())
        .map((connectionData) => new SlackSocket(connectionData, openObserver, closeObserver))
    }
    
    constructor(connectionDetails, openObserver?:Rx.Observer<any>, closeObserver?:Rx.Observer<any>){
        //create socket
        const socket = new ws(connectionDetails.url);
        
        //handler for connection opening
        const openHandler = (event) => {
            openObserver.onNext(event);
            openObserver.onCompleted();
            socket.removeListener('open', openHandler);
        }
        
        //incoming messages 
        const messageStream= Rx.Observable.create((gen:Rx.Observer<SlackEvent>) => {
            
            const messageHandler = (message) => gen.onNext(JSON.parse(message.data));
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
        
        const responseStream = Rx.Observer.create((message:SlackEvent) => {
            console.log('sending message,',message);
            socket.send(message);
        });
        
        this._subject = Rx.Subject.create(responseStream, messageStream);
        this.connectionData = connectionDetails;
        this.botId = `<@${connectionDetails.self.id}>`
        this.messages = this._subject.filter(isMessage);
        this.mentions = this.messages.filter((message) => message.text.indexOf(this.botId) > -1)
   }
   
   send(message){
       this._subject.onNext(JSON.stringify(message))
   }
}