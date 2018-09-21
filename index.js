//TODO List

const TelegramBot = require('node-telegram-bot-api');
const commons = require('./method.js');
const config = require('./config.js');
const database = require('./db.js');

const dbConnection = commons.createDbPool(config.mySqlInfo);

const token = config.token;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});


bot.onText(/\/echo (.+)/, (msg, match) => {


  const chatId = msg.chat.id;
  const resp = match[1]; 

  bot.sendMessage(chatId, resp);
});

bot.onText(/\/start/, (msg, match) => {
  bot.sendMessage(msg.chat.id, 
    "Welcome\n" +
    "\/addtodo date\/datetime\#title\#desc\n" +
    "\/mytodo today\/tomorrow\/all\/date\n" +
    "\/tododetail today\/tomorrow\/all\/date#number"
    );
});

bot.onText(/\/addtodo (.+)/, (msg, match) => {
  let text = match[1];
  console.log('Splitting String ' + text);
  match = match[1].split("#");
  if(match.length < 3){
    bot.sendMessage(msg.chat.id, msg.chat.id+"Not enough arguments to add a todo list")
  }else{
    let message = "";
    let adddate = new Date(match[0]);
    switch (database.createTodo(dbConnection, msg.chat.id, msg.chat.username, adddate, match[1], match[2])){
      case 0: 
        message = "Success add task to Todo list";
        break;
      case -1:
        message = "Something error"
      default: 
        message = "An Unspecified Error occurred. Try again later"; 
        break;
    }
    bot.sendMessage(msg.chat.id, message);
  }
});

bot.onText(/\/mytodo (.+)/,(msg, match) => {
  console.log('Splitting String ' + match[1]);
  database.getMyTodoList(dbConnection, msg.chat.id, (res) => {
    if (res == null) {
      bot.sendMessage(msg.chat.id, "You dont have a todo list");
      return;
    }
    let keyboard = [];
    let text = "";
    let no = 0;
    switch(match[1].toLowerCase()){
      case "all":
        text = "all\n"
        for (let i = 0; i < res.length; i++){
          keyboard.push([res[i].todotitle])
          let y = new Date(res[i].tododate).getFullYear();
          let m = new Date(res[i].tododate).getMonth();
          let d = new Date(res[i].tododate).getDate();
          no++;
          text += no + ". " + res[i].todotitle + " on " + d + " " + config.months(m) + " " + y +"\n";
        }
        break;
      case "today":
        text = "today\n";
        for (let i = 0; i < res.length; i++){
          let now = new Date();
          let y = new Date(res[i].tododate).getFullYear();
          let m = new Date(res[i].tododate).getMonth();
          let d = new Date(res[i].tododate).getDate();
          if(now.getFullYear() == y && now.getMonth() == m && now.getDate() == d){
            keyboard.push([res[i].todotitle])
            no++;
            text += no + ". " + res[i].todotitle + "\n";
          }
        }
        break;
      case "tomorrow":
        text = "tomorrow\n";
        for (let i = 0; i < res.length; i++){
          let tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate()+1);
          console.log(tomorrow);
          let y = new Date(res[i].tododate).getFullYear();
          let m = new Date(res[i].tododate).getMonth();
          let d = new Date(res[i].tododate).getDate();
          console.log(tomorrow.getFullYear() +" "+ y +" "+ tomorrow.getMonth() +" "+ m +" "+ tomorrow.getDate() +" "+ d)
          if(tomorrow.getFullYear() == y && tomorrow.getMonth() == m && tomorrow.getDate() == d){
            keyboard.push([res[i].todotitle])
            no++;
            text += no + ". " + res[i].todotitle + "\n";
          }
        }
        break;
      default:
        if(!/^\d{4}\-\d{1,2}\-\d{1,2}$/.test(match[1])){
          bot.sendMessage(msg.chat.id, "The argument is incorrect");
          return; 
        }else{
          text = "on" + match[1] + "\n";
          for (let i = 0; i < res.length; i++){
            let now = new Date(match[1]);
            let y = new Date(res[i].tododate).getFullYear();
            let m = new Date(res[i].tododate).getMonth();
            let d = new Date(res[i].tododate).getDate();
            if(now.getFullYear() == y && now.getMonth() == m && now.getDate() == d){
              keyboard.push([res[i].todotitle])
              no++;
              text += no + ". " + res[i].todotitle + "\n";
            }
          }
        }
        break;
    }

    if(keyboard.length <= 0){
      bot.sendMessage(msg.chat.id, "You are free " + text);
      return;
    }
    //let reply = {keyboard: keyboard, one_time_keyboard: true, selective: true, resize_keyboard: true};

    bot.sendMessage(msg.chat.id, "Your Todo List " + text.charAt(0).toUpperCase() + text.substr(1)) //optional {reply_markup: reply, reply_to_message_id: msg.message_id}
  });
});

bot.onText(/\/tododetail (.+)/,(msg, match) => {
  match = match[1].split("#");
  switch(match[0].toLocaleLowerCase()){
    case "today":
      let mdate = new Date();
      mdate = mdate.getFullYear() + "-" + (mdate.getMonth()+1) + "-" + mdate.getDate();
      //console.log(mdate);
      database.getMyTodoDetail(dbConnection, msg.chat.id, mdate, (res) =>{
        if (res == null) {
          bot.sendMessage(msg.chat.id, "You dont have a todo list");
          return;
        }
        let keyboard = [];
        let text = "";
        let no = 0;
        console.log(match[1]);
        for (let i = 0; i < res.length; i++){
          let y = new Date(res[i].tododate).getFullYear();
          let m = new Date(res[i].tododate).getMonth();
          let d = new Date(res[i].tododate).getDate();
          keyboard.push([res[i].todotitle])
          no++;
          if(match[1] == no){
            text += res[i].todotitle + " on " + d + " " + config.months(m) + " " + y +"\n--\n" + res[i].tododesc;
          }
        }
        //console.log(keyboard);
        if(keyboard.length <= 0){
          bot.sendMessage(msg.chat.id, "The argument is incorrect");
          return;
        }

        //let reply = {keyboard: keyboard, one_time_keyboard: true, selective: true, resize_keyboard: true};

        bot.sendMessage(msg.chat.id, "*Your Todo Detail*\n" + text, {parse_mode: "Markdown"}) //optional {reply_markup: reply, reply_to_message_id: msg.message_id}
 
      });
      break;
    case "tomorrow":
      let tomorrow = new Date();
      let mtdate = new Date();
      tomorrow.setDate(tomorrow.getDate()+1);
      mtdate = tomorrow.getFullYear() + "-" + (tomorrow.getMonth()+1) + "-" + tomorrow.getDate();
      //console.log(mdate);
      database.getMyTodoDetail(dbConnection, msg.chat.id, mtdate, (res) =>{
        if (res == null) {
          bot.sendMessage(msg.chat.id, "You dont have a todo list");
          return;
        }
        let keyboard = [];
        let text = "";
        let no = 0;
        //console.log(match[1]);
        for (let i = 0; i < res.length; i++){
          let y = new Date(res[i].tododate).getFullYear();
          let m = new Date(res[i].tododate).getMonth();
          let d = new Date(res[i].tododate).getDate();
          keyboard.push([res[i].todotitle])
          no++;
          if(match[1] == no){
            text += res[i].todotitle + " on " + d + " " + config.months(m) + " " + y +"\n--\n" + res[i].tododesc;
          }
        }
        //console.log(keyboard);
        if(keyboard.length <= 0){
          bot.sendMessage(msg.chat.id, "The argument is incorrect or you dont have task on your todo list");
          return;
        }

        //let reply = {keyboard: keyboard, one_time_keyboard: true, selective: true, resize_keyboard: true};

        bot.sendMessage(msg.chat.id, "*Your Todo Detail*\n" + text, {parse_mode: "Markdown"}) //optional {reply_markup: reply, reply_to_message_id: msg.message_id}
      });
      break;
    default:

      break;
  }
});


function alertstart(){
  //console.log("check todo list");
  let now = new Date();
  let alerttime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0, 0) - now;
  
  if (alerttime < 0) {
    alerttime += 86400000;
  }

  //bot.sendMessage(261018396, "Bot Online" + alerttime);

  setTimeout(function(){
    database.getTodoList(dbConnection, (res) => {
      if (res == null) {
        bot.sendMessage(261018396, "You free today");
        return;
      }
      let keyboard = [];
      let text = "today";
      let no = 0;
      for (let i = 0; i < res.length; i++){
        let now = new Date();
        let y = new Date(res[i].tododate).getFullYear();
        let m = new Date(res[i].tododate).getMonth();
        let d = new Date(res[i].tododate).getDate();
        if(now.getFullYear() == y && now.getMonth() == m && now.getDate() == d){
          keyboard[res[i].todoid].push([res[i].todotitle])
          no++;
          text += no + ". " + res[i].todotitle + "\n";;
        }
      }

      if(keyboard.length <= 0){
        bot.sendMessage(261018396, "You are free " + text);
        return;
      }

      //let reply = {keyboard: keyboard, one_time_keyboard: true, selective: true, resize_keyboard: true};
  
      bot.sendMessage(261018396, "Your Todo List " + text) //optional {reply_markup: reply, reply_to_message_id: msg.message_id}
    });
    alertstart();
  },alerttime);
};

alertstart();
/*
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  //bot.sendMessage(chatId, 'Received your message');
});*/