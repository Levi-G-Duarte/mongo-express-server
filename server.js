const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const app = express()
const port = process.env.PORT || 3000;

app.use(express.json())

const connections = {}
const models = {}

const bankUserSchema = new mongoose.Schema({});

const getConnection = async (dbName) => {
    if (connections != dbName) {
        connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName });
        console.log(dbName);
    } else {
        console.log('Reusing existing connection dbName')
    }
    return connections[dbName]
} 

const getModel = async (dbName, collectionName) => {
    console.log("getModel called with:", { dbName, collectionName });
    const modelKey = `${dbName}-${collectionName}`;
    if (!models[modelKey]) {
        const connection = await getConnection(dbName);
        // Create a dynamic schema that accepts any fields
        const dynamicSchema = new mongoose.Schema({}, { strict: false });
        models[modelKey] = connection.model(
            collectionName,
            dynamicSchema,
            collectionName // Use exact collection name from request
        );
        console.log("Created new model for collection:", collectionName);
    }
    return models[modelKey];
};

app.get('/find/:database/:collection', async (req, res) => {
    try{
        const { database, collection } = req.params;
        const Model = await getModel(database, collection);
        const documents = await Model.find({})
        console.log(`query executed, documeny count is: ${documents.length}`)
        res.status(200).json(documents)

    }catch (err){
        console.log("error in Get Route:", err)
        res.status(500).json({ error: err.message });
    }
})

const startServer = async () => {
    try {
        app.listen(port, () => {
        console.log("the server is running on port")
    })    
    } catch (err) {
        console.error('error staring server', err)
        process.exit(1)
    }
}

startServer()