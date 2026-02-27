// CALL ENV FILE
require('dotenv').config()
var cron = require('node-cron');

var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session')
var path = require('path');


var cors = require('cors')

var app = express();

app.use(cors());

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: '71e0aba070df4892e7384da1828fbfff',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))

// APP  CONTAINER =========== >> 
let conn = require('./config/DbConnect');

process.env.TZ = 'Asia/Manila';

conn.connectToServer( async function( err, client ) { // MAIN MONGO START
  
  // console.log(new Date().toLocaleDateString('en-US').replace(/\//g, '-'));
  if (err) console.log(err);
  // start the rest of your app here

  // const helpers = require("./helpers")
  // await helpers.sendSQSMessage("test 2 visit <a href='mailto:test@test.cc'>test</a>")
  // console.log("-sent-")
  const service = require('./services/detectorService')
  // service.sendServiceStatus()

  if (!process.env.officeLocation) {
    console.error("Please set location inside .env file.\nAfter setting officeLocation='<location name>', restart app.");
    return;
  } else {

    cron.schedule('0 8-16 * * * *', () => {
      service.runCiscoDetector()  
    });

    cron.schedule("*/10 * * * * *", async () => {
      service.updateServiceStatus()  
    });

    cron.schedule("0 */5 * * * *", async () => {
      service.sendServiceStatus()  
    });

  }
  

  app.use(function(req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function(err, req, res, next) {

    
    // set locals, only providing error in development
    if ( process.env.ENVIRONMENT == "dev" ) {

      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'dev' ? err : {};
      res.status(err.status || 500);
      res.render('error');

    } else {
      // errorLogService.logger(err.status || 500,err.message,req)
      res.status(err.status || 500);
      // res.redirect("/")
    }
  });
  
  
}); // AWS MONGO CLOSE



module.exports = app;
