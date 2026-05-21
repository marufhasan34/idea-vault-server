const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
dotenv.config()
const app = express()
app.use(cors())
const port = process.env.PORT || 5000

app.get('/',(req,res) => {
    res.send('hello world')
})

app.listen(port, () => {
    console.log('example app listening on port')
})



const uri = "mongodb+srv://IdeaVault:lcikOsbuwqmmoNpn@cluster0.8qk8fr0.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    const db = client.db('IdeaVault')
    const ideasCollection = db.collection('ideas')

    app.get('/ideas', async (req,res) => {
      const cursor = ideasCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/featured', async (req,res) => {
      const cursor = ideasCollection.find().limit(3)
      const result = await cursor.toArray()
      res.send(result)
    })

  app.get('/ideas/:ideasId', async(req,res) => {
    const {ideasId} = req.params
    const query = {_id: new ObjectId(ideasId)}
    const result = await ideasCollection.findOne(query)
    res.send(result)
  })





    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
