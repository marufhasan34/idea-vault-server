const express = require('express')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { createRemoteJWKSet } = require('jose-cjs');

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// ✅ Middleware আগে
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
}))
app.use(express.json()) // ✅ req.body এর জন্য

const uri = process.env.MONGODB_URI;

const jwks = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
)

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = (req, res, next) => {
  console.log(`${req.method} | ${req.url}`)
  next()
}

const verifyToken = async (req, res, next) => {
  const token = req.headers?.authorization?.split(' ')[1]
  if (!token) return res.status(401).send({ message: 'Unauthorized' })
  // TODO: jwt.verify(token, process.env.JWT_SECRET, ...)
  next()
}

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db('IdeaVault')
    const ideasCollection = db.collection('ideas')

    app.post('/ideas', async(req,res) => {
      const ideasData = req.body
      const result = await ideasCollection.insertOne(ideasData)
      res.json(result)
    })

    app.get('/', (req, res) => res.send('hello world'))

    app.get('/ideas', async (req, res) => {
      try {
        const result = await ideasCollection.find().toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send({ message: 'Failed to fetch ideas' })
      }
    })

    app.get('/featured', async (req, res) => {
      try {
        const result = await ideasCollection.find().limit(3).toArray()
        res.send(result)
      } catch (err) {
        res.status(500).send({ message: 'Failed to fetch featured' })
      }
    })

    app.get('/ideas/:ideasId', logger, verifyToken, async (req, res) => {
      try {
        const { ideasId } = req.params
        const query = { _id: new ObjectId(ideasId) }
        const result = await ideasCollection.findOne(query)
        if (!result) return res.status(404).send({ message: 'Not found' })
        res.send(result)
      } catch (err) {
        res.status(500).send({ message: 'Invalid ID or server error' })
      }
    })

    // ✅ DB connect হওয়ার পরে listen
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`)
    })

  } catch (err) {
    console.error('MongoDB connection failed:', err)
    process.exit(1)
  }
}

run();