const path = require("path");
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const app = express();

// 2. MIDDLEWARE (The Security & Data Translators)
app.use(
  cors({
    origin: ["http://localhost:3000"], // Allows your local React app to talk to this server
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json()); // Tells the server to understand JSON data from the frontend

const Note = require("../models/note.js");

/*if (dotenvResult.error) {
    console.error('Failed to load .env file:', dotenvResult.error.message);
}*/

//const mongoUri = process.env.MONGO_URI; NO NEED FOR THIS AS NOW WE CONNECTED TO AWS SECRETS MANAGER MANAGER

const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-east-1",
});
let mongoUri = process.env.MONGO_URI || null;

async function connectDB() {
  try {
    if (!mongoUri) {
      const response = await client.send(
        new GetSecretValueCommand({
          SecretId: process.env.SECRET_ID || "prod/notesapi/dburl",
        }),
      );

      const secret = JSON.parse(response.SecretString);
      mongoUri = secret.MONGO_URI;
    }

    if (!mongoUri) {
      throw new Error(
        "MONGO_URI is missing. Check your .env file or AWS secret.",
      );
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully! 🎉");
    return mongoUri;
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
}

function ensureDbAvailable(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    message:
      "Database is unavailable right now. Please check your MongoDB connection.",
  });
}

const PORT = process.env.PORT || 5000;

// 4. THE MODEL (The Rules for a Note)
// This tells MongoDB exactly what a "Note" should look like.
const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
); // Automatically adds createdAt and updatedAt dates

//const Note = mongoose.model("Note", noteSchema);

app.get("/", (req, res) => {
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

// GET: Fetch all notes
app.get("/notes", ensureDbAvailable, async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 }); // Newest notes first
    res.status(200).json(notes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch notes", error: error.message });
  }
});

// POST: Create a new note
app.post("/notes", ensureDbAvailable, async (req, res) => {
  try {
    const { title, content } = req.body; // Extract data sent from React

    // Create a new Note object using our Model
    const newNote = new Note({
      title: title,
      content: content,
    });

    // Save it to MongoDB
    const savedNote = await newNote.save();
    res.status(201).json(savedNote); // Send the saved note back to React
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create note", error: error.message });
  }
});
// PUT: Update an existing note by its ID
app.put("/notes/:id", ensureDbAvailable, async (req, res) => {
  try {
    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id, // The ID from the URL
      {
        title: req.body.title, // The new title from the frontend
        content: req.body.content, // The new content from the frontend
      },
      { new: true, runValidators: true }, // new: true returns the updated version
    );

    // If the note doesn't exist, send a 404 error
    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Send the successfully updated note back to the frontend
    res.status(200).json(updatedNote);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update note", error: error.message });
  }
});

// DELETE: Remove a note by its ID
app.delete("/notes/:id", ensureDbAvailable, async (req, res) => {
  try {
    const noteId = req.params.id; // Grab the ID from the URL (e.g., /notes/12345)

    // Find the note in MongoDB and delete it
    const deletedNote = await Note.findByIdAndDelete(noteId);

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete note", error: error.message });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API route not found",
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
  } catch (error) {
    console.warn("Continuing without database connection:", error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
