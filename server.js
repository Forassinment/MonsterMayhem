require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://saadd:saad123@cluster0.ee2rk.mongodb.net/monster-maheym', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const gameSchema = new mongoose.Schema({
    players: [String],
    positions: [String],
    status: String,
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

app.post('/api/start-game', (req, res) => {
    const { players } = req.body;
    const newGame = new Game({ players, positions: [], status: 'In Progress' });
    newGame.save().then(game => res.json(game));
});

app.post('/api/save-game', (req, res) => {
    const { players, positions, status } = req.body;
    const newGame = new Game({ players, positions, status });
    newGame.save().then(game => res.json(game));
});

app.get('/api/game-stats', (req, res) => {
    Game.find().sort({ createdAt: -1 }).then(games => res.json(games));
});

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
