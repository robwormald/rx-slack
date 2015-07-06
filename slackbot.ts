/// <reference path="typings/rx/rx" />
/// <reference path="typings/ws/ws" />

import Rx = require('rx');
import RxNode = require('rx-node');
import Fetch = require('node-fetch');
import ws = require('ws');

const SLACK_URL = (method, token) => `https://slack.com/api/${method}?token=${token}`

const getBotUrl = (slackDetails) => {
    console.log(slackDetails.url);
    return slackDetails.url
}
    

function connect(token){
    let startConnection = Fetch(SLACK_URL('rtm.start',token));
    return Rx.Observable.fromPromise(startConnection.then((res) => res.json()));
}

connect(process.env.SLACK_TOKEN)
  .flatMapLatest(getBotUrl)
  .subscribe(function(res){
    console.log(res);
},function(err){
    console.log(err)
})