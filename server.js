require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
const mongodb_uri = (process.env.MONGODB_URI || process.env.mongodb_uri || '').trim();

let client;
let defaultDbName;

function getDbNameFromUri(uri) {
    try {
        const url = new URL(uri);
        const dbFromPath = url.pathname.replace('/', '');
        if (dbFromPath) return dbFromPath;

        const authSource = url.searchParams.get('authSource');
        if (authSource && authSource !== 'admin') return authSource;
    } catch {
        return undefined;
    }
    return undefined;
}

async function connectMongo() {
    if (!mongodb_uri) {
        console.warn('MongoDB URI is missing. Set MONGODB_URI (or mongodb_uri) before starting the server.');
        return;
    }

    try {
        client = new MongoClient(mongodb_uri, {
            serverSelectionTimeoutMS: 10000
        });
        await client.connect();
        defaultDbName = process.env.MONGODB_DB || getDbNameFromUri(mongodb_uri);
        console.log(process.env.MONGODB_URI);
        console.log('Connected to MongoDB cluster.');
    } catch (error) {
        client = undefined;
        console.error('MongoDB connection failed:', error.message);
    }
}

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, 'public/index.html'));
})

app.get('/api/table', async (req, res) => {
    try {
        if (!client) {
            return res.status(500).json({ error: 'MongoDB is not connected. Check MONGODB_URI.' });
        }

        const dbName = req.query.db || defaultDbName;
        const collectionName = req.query.collection || process.env.MONGODB_COLLECTION;
        const limit = Math.min(Number(req.query.limit) || 20, 100);

        if (!dbName) {
            return res.status(400).json({ error: 'Database name not found. Add db in MONGODB_URI path, set MONGODB_DB, or pass ?db=...' });
        }

        if (!collectionName) {
            return res.status(400).json({ error: 'Collection is required. Pass ?collection=... or set MONGODB_COLLECTION.' });
        }

        const db = client.db(dbName);
        const docs = await db.collection(collectionName).find({}).limit(limit).toArray();

        res.json({
            db: dbName,
            collection: collectionName,
            count: docs.length,
            rows: docs
        });
    } catch (error) {
        console.error('Error reading collection:', error);
        res.status(500).json({ error: 'Failed to fetch data from MongoDB.' });
    }
});

connectMongo()
    .finally(() => {
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    });