const express = require('express');
const app = express();
app.use(express.json());

// Mock Database (In-memory array)
let notes = [
    { id: 1, title: "First Note", content: "Hello from JYOTI OLI to Paras Oli paglooo" }
];
let nextId = 2; // Naye notes ko ID dene ke liye tracker

// ==========================================
// ROUTES
// ==========================================

// 1. GET: Fetch all notes
app.get('/notes', (req, res) => {
    res.json(notes);
});

// 2. POST: Create a new note
app.post('/notes', (req, res) => {
    const newNote = {
        id: nextId++, 
        title: req.body.title,
        content: req.body.content
    };
    notes.push(newNote);
    res.status(201).json(newNote);
});

// 3. PUT: Update an existing note by ID
app.put('/notes/:id', (req, res) => {
    const noteId = parseInt(req.params.id);
    const note = notes.find(n => n.id === noteId);

    if (!note) {
        return res.status(404).json({ message: "Note not found" });
    }

    note.title = req.body.title || note.title;
    note.content = req.body.content || note.content;
    res.json(note);
});

// 4. DELETE: Remove a note by ID
app.delete('/notes/:id', (req, res) => {
    const noteId = parseInt(req.params.id);
    notes = notes.filter(n => n.id !== noteId);
    res.json({ message: "Note deleted successfully" });
});

// ==========================================
// SERVER START
// ==========================================

// Server ko port 3000 par start karna
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});