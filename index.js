const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hatjk.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const port = 5000

const app = express()

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./configs/burj-al-arab-extreme-firebase-adminsdk-ssi82-422896a1cf.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  
  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
    .then(result => {
      res.send(result.insertedCount > 0);
    })
    console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      console.log({ idToken });
      // idToken comes from the client app
      admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          let tokenEmail = decodedToken.email;
          if(tokenEmail == req.query.email){
            bookings.find({email: req.query.email})
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
          else{
            res.status(401).send('Unauthorized access!!!')
          }
          // ...
        }).catch(function(error) {
          res.status(401).send('Unauthorized access!!!')
        });
    }
    else{
      res.status(401).send('Unauthorized access!!!')
    }
    
  })

});


app.listen(port)