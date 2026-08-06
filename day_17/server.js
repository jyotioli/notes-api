//const dotenvResult = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const app = express();
app.use(express.json());

const Note = require('../models/note.js');

/*if (dotenvResult.error) {
    console.error('Failed to load .env file:', dotenvResult.error.message);
}*/

//const mongoUri = process.env.MONGO_URI; NO NEED FOR THIS AS NOW WE CONNECTED TO AWS SECRETS MANAGER MANAGER

// Apna region wahi rakhein jahan aapne secret banaya hai (e.g., 'us-east-1')
const client = new SecretsManagerClient({ region: "us-east-1" });
let mongoUri = null;

async function connectDB() {
    try {
        // secret naam se replace karein
        const response = await client.send(
            new GetSecretValueCommand({ SecretId: "prod/notesapi/dburl" })
        );

        // Secret ko string se wapas parse karna padega
        const secret = JSON.parse(response.SecretString);
        mongoUri = secret.MONGO_URI;

        if (!mongoUri) {
            throw new Error('MONGO_URI is missing in the secret.');
        }

        // Ab asli connection
        await mongoose.connect(mongoUri);
        console.log("MongoDB connected via AWS Secrets Manager! 🎉");
        return mongoUri;
    } catch (error) {
        console.error("Secrets Manager se password laane mein error:", error);
        throw error;
    }
}

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send(`
        <html>
            <head>
                <title>Notes API with AWS Secrets Manager</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background: #f7f7fb; color: #1f2937; }
                    .card { max-width: 720px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
                    h1 { margin-top: 0; }
                    code { background: #eef2ff; padding: 2px 6px; border-radius: 6px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Notes API</h1>
                    <p>The API is running and connected to MongoDB.</p>
                    <p>Available endpoints:</p>
                    <ul>
                        <li><code>GET /notes</code></li>
                        <li><code>POST /notes</code></li>
                        <li><code>PUT /notes/:id</code></li>
                        <li><code>DELETE /notes/:id</code></li>
                    </ul>
                </div>
            </body>
        </html>
    `);
});

app.get('/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Notes fetch nahi hue', error: error.message });
    }
});

app.post('/notes', async (req, res) => {
    try {
        const newNote = await Note.create({
            title: req.body.title,
            content: req.body.content,
        });

        res.status(201).json(newNote);
    } catch (error) {
        res.status(500).json({ message: 'Note save nahi hua', error: error.message });
    }
});

app.put('/notes/:id', async (req, res) => {
    try {
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                content: req.body.content,
            },
            { new: true, runValidators: true }
        );

        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: 'Update fail ho gaya', error: error.message });
    }
});

app.delete('/notes/:id', async (req, res) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);

        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }

        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Delete fail ho gaya', error: error.message });
    }
});

app.use('/api', (req, res) => {
    res.status(404).json({
        message: 'API route not found',
        path: req.originalUrl,
    });
});

app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
            <h1 style="color: #dc2626;">404</h1>
            <h2>Page not found</h2>
            <p>The page you requested does not exist. Go back to <a href="/">Home</a>.</p>
        </div>
    `);
});

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

startServer();