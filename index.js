const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
require('dotenv').config();

//============================= APP USE ==============================
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static('service'));
app.use(fileUpload());

//================================ Mongodb Connection==================
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.or4h7.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  console.log(uri);
  //============================= ALL DB COLLECTION ===================
  const adminCollection = client.db("proMarketer").collection("adminCollection");
  const serviceCollection = client.db("proMarketer").collection("serviceCollection")
  const orderCollection = client.db("proMarketer").collection("orderCollection")


  //==================================== ADD ADMIN ====================
  app.post('/addAdmin', (req, res) => {
    const admin = req.body;
    adminCollection.insertOne(admin).then((result) => {
      // console.log(result)
      res.send(result.insertedCount > 0);
    });
  });

  //=================== Check Adming ==================================
  app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({ email: email })
      .toArray((err, admins) => {
        console.log(admins);
        res.send(admins.length > 0);
      })
  });

  //=================== Add Service by Admin ==================================
  app.post('/addService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const price = req.body.price;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64'),
    };

    serviceCollection
      .insertOne({ title, description, price, image })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  // Show service in the home page
  app.get('/services', (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  // Show User booking list
  app.get('/orderCollection', (req, res) => {
    orderCollection
      .find({ email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  // Get user selected service by pramas
  app.get('/services/:_id', (req, res) => {
    serviceCollection
      .find({ _id: ObjectId(req.params._id) })
      .toArray((err, documents) => {
        res.send(documents[0]);
      });
  });

  // User place order
  app.post('/placeOrder', (req, res) => {
    const newRegistration = req.body;
    orderCollection.insertOne(newRegistration).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  // Admin dashboard, show all user order
  app.get('/orderCollection', (req, res) => {
    orderCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  // User order status update rolled by admin only
  app.patch('/updateServiceStatus/:_id', (req, res) => {
    orderCollection
      .updateOne(
        { _id: ObjectId(req.params._id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then((result) => {
        console.log(result);
        res.send(result.modifiedCount > 0);
      });
  });

});





// ======================LISTENER PORT===================
const PORT = 5000;
app.get('/', (req, res) => {
  res.send('The Pro-Marketer Server is running');
});

app.listen(process.env.PORT || PORT);