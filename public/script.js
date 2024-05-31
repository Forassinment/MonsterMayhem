document.getElementById('start-game').addEventListener('click', startGame);
document.getElementById('skip-turn').addEventListener('click', skipTurn);
document.getElementById('close-message').addEventListener('click', closeMessage);
document.getElementById('submit-move').addEventListener('click', submitMove);
document.getElementById('cancel-move').addEventListener('click', cancelMove);
document.getElementById('show-rules').addEventListener('click', showRules);
document.getElementById('close-rules').addEventListener('click', closeRules);
document.getElementById('show-stats').addEventListener('click', showStats);
document.getElementById('close-stats').addEventListener('click', closeStats);

const board = document.querySelector('#board table');
const playerActions = document.getElementById('player-actions');
const statusDiv = document.getElementById('status');
const modal = document.getElementById('monster-modal');
const modalButtons = document.querySelectorAll('.monster-option');
const messageModal = document.getElementById('message-modal');
const messageText = document.getElementById('message-text');
const moveModal = document.getElementById('move-modal');
const rulesModal = document.getElementById('rules-modal');
const statsDiv = document.getElementById('stats');
const eliminatedList = document.getElementById('eliminated-list');
const playerStatsDiv = document.getElementById('player-stats');
const gameContentDiv = document.getElementById('game-content');
const eliminatedPlayersDiv = document.getElementById('eliminated-players');
const statsModal = document.getElementById('stats-modal');
const gameStatsDiv = document.getElementById('game-stats');

let currentPlayerIndex = 0;
const players = [];
const monsters = { 1: [], 2: [], 3: [], 4: [] };
const maxMonsters = 15;
const maxMonsterRemovals = 10;
const positions = [];
const areas = {
    1: { startRow: 0, endRow: 4, startCol: 0, endCol: 4 },
    2: { startRow: 0, endRow: 4, startCol: 5, endCol: 9 },
    3: { startRow: 5, endRow: 9, startCol: 0, endCol: 4 },
    4: { startRow: 5, endRow: 9, startCol: 5, endCol: 9 }
};
const monsterTypes = {
    1: { name: 'vampire', icon: '<img src="vampire.png" alt="Vampire" class="monster-image">' },
    2: { name: 'werewolf', icon: '<img src="werewolf.png" alt="Werewolf" class="monster-image">' },
    3: { name: 'ghost', icon: '<img src="ghost.png" alt="Ghost" class="monster-image">' }
};

let selectedCell = null;

function startGame() {
    for (let i = 1; i <= 4; i++) {
        const playerName = document.getElementById(`player${i}`).value.trim();
        if (!playerName) {
            showMessage(`Please enter Player name ${i}`);
            return;
        }
        players.push({ name: playerName, id: i, monsterCount: 0, monstersPlaced: 0, monstersLost: 0 });
    }

    fetch('/api/start-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ players: players.map(player => player.name) }),
    });

    document.getElementById('player-names').classList.add('hidden');
    gameContentDiv.classList.remove('hidden');
    eliminatedPlayersDiv.classList.remove('hidden');
    playerStatsDiv.classList.remove('hidden');
    playerActions.classList.remove('hidden');
    createBoard();
    determineFirstPlayer();

    // Show buttons on the home screen
    document.getElementById('insert-monster').style.display = 'inline-block';
    document.getElementById('move-monster').style.display = 'inline-block';
    document.getElementById('skip-turn').style.display = 'inline-block';
}

function createBoard() {
    for (let i = 0; i < 10; i++) {
        const row = board.insertRow();
        for (let j = 0; j < 10; j++) {
            const cell = row.insertCell();
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);

            // Adding numbering as a watermark
            const waterMark = document.createElement('span');
            waterMark.classList.add('watermark');
            waterMark.innerText = `${i},${j}`;
            cell.appendChild(waterMark);

            if (i < 5 && j < 5) {
                cell.classList.add('light-green');
            } else if (i < 5 && j >= 5) {
                cell.classList.add('light-orange');
            } else if (i >= 5 && j < 5) {
                cell.classList.add('light-yellow');
            } else {
                cell.classList.add('light-blue');
            }
        }
    }
    updateStatus();
}

function determineFirstPlayer() {
    currentPlayerIndex = Math.floor(Math.random() * players.length);
    updateCurrentPlayer();
}

function updateCurrentPlayer() {
    const currentPlayer = players[currentPlayerIndex];
    statusDiv.innerText = `Player ${currentPlayer.name} turn`;
    statusDiv.style.color = '#076f99';
    statusDiv.style.fontSize = '30px';
}

function handleCellClick(event) {
    const cell = event.target.closest('td');
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    const currentPlayer = players[currentPlayerIndex];

    if (currentPlayer.monstersPlaced >= maxMonsters) {
        showMessage(`You have placed all your ${maxMonsters} monsters!`);
        return;
    }

    if (isValidInsertion(currentPlayer, row, col)) {
        selectedCell = cell;
        showModal();
    } else {
        showMessage(`You can only insert monsters within your area!`);
    }
}

function isValidInsertion(player, row, col) {
    const area = areas[player.id];
    return (row >= area.startRow && row <= area.endRow && col >= area.startCol && col <= area.endCol);
}

function showModal() {
    modal.style.display = 'block';
}

function hideModal() {
    modal.style.display = 'none';
}

modalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const monsterType = parseInt(button.dataset.monster);
        const row = parseInt(selectedCell.dataset.row);
        const col = parseInt(selectedCell.dataset.col);
        const currentPlayer = players[currentPlayerIndex];
        insertMonster(currentPlayer, row, col, monsterType);
        hideModal();
    });
});

function insertMonster(player, row, col, monsterType) {
    if (!monsterTypes[monsterType]) {
        showMessage('Invalid monster type!');
        return;
    }

    const cell = board.rows[row].cells[col];
    if (cell.dataset.player) {
        showMessage('Cell already occupied!');
        return;
    }

    cell.innerHTML = monsterTypes[monsterType].icon;
    cell.dataset.player = player.id;
    cell.dataset.type = monsterType;

    player.monsterCount++;
    player.monstersPlaced++;
    endTurn();
}

function endTurn() {
    updateStatus();
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateCurrentPlayer();
}

document.getElementById('move-monster').addEventListener('click', () => {
    const currentPlayer = players[currentPlayerIndex];
    const monsterCells = Array.from(board.getElementsByTagName('td'))
        .filter(cell => cell.dataset.player == currentPlayer.id);

    if (monsterCells.length === 0) {
        showMessage('No monsters to move!');
        return;
    }

    showMoveModal();
});

function showMoveModal() {
    moveModal.style.display = 'block';
}

function hideMoveModal() {
    moveModal.style.display = 'none';
}

function submitMove() {
    const fromRow = parseInt(document.getElementById('from-row').value);
    const fromCol = parseInt(document.getElementById('from-col').value);
    const toRow = parseInt(document.getElementById('to-row').value);
    const toCol = parseInt(document.getElementById('to-col').value);
    const currentPlayer = players[currentPlayerIndex];

    if (isValidMove(currentPlayer, fromRow, fromCol, toRow, toCol)) {
        moveMonster(currentPlayer, fromRow, fromCol, toRow, toCol);
    } else {
        showMessage('Invalid move!');
    }

    hideMoveModal();
}

function cancelMove() {
    hideMoveModal();
}

function isValidMove(player, fromRow, fromCol, toRow, toCol) {
    const area = areas[player.id];
    return (toRow >= area.startRow && toRow <= area.endRow && toCol >= area.startCol && toCol <= area.endCol);
}

function moveMonster(player, fromRow, fromCol, toRow, toCol) {
    const fromCell = board.rows[fromRow].cells[fromCol];
    const toCell = board.rows[toRow].cells[toCol];

    if (fromCell.dataset.player != player.id) {
        showMessage('You can only move your own monsters!');
        return;
    }

    const validMove = (
        (Math.abs(toRow - fromRow) <= 2 && Math.abs(toCol - fromCol) == 0) ||
        (Math.abs(toRow - fromRow) == 0 && Math.abs(toCol - fromCol) <= 2) ||
        (Math.abs(toRow - fromRow) <= 2 && Math.abs(toCol - fromCol) <= 2)
    );

    if (!validMove) {
        showMessage('Invalid move!');
        return;
    }

    const monsterType = parseInt(fromCell.dataset.type);
    fromCell.innerHTML = '';
    fromCell.dataset.player = '';
    fromCell.dataset.type = '';

    if (toCell.dataset.player) {
        handleCombat(toCell, monsterType);
    } else {
        toCell.innerHTML = monsterTypes[monsterType].icon;
        toCell.dataset.player = player.id;
        toCell.dataset.type = monsterType;
    }

    endTurn();
}

function handleCombat(cell, incomingMonsterType) {
    const defendingMonsterType = parseInt(cell.dataset.type);
    const defendingPlayerId = parseInt(cell.dataset.player);

    if ((incomingMonsterType === 1 && defendingMonsterType === 2) ||
        (incomingMonsterType === 2 && defendingMonsterType === 3) ||
        (incomingMonsterType === 3 && defendingMonsterType === 1)) {
        cell.innerHTML = monsterTypes[incomingMonsterType].icon;
        cell.dataset.player = players[currentPlayerIndex].id;
        cell.dataset.type = incomingMonsterType;
        decrementMonsterCount(defendingPlayerId);
    } else if (incomingMonsterType === defendingMonsterType) {
        cell.innerHTML = '';
        cell.dataset.player = '';
        cell.dataset.type = '';
        decrementMonsterCount(defendingPlayerId);
        decrementMonsterCount(players[currentPlayerIndex].id);
    } else {
        decrementMonsterCount(players[currentPlayerIndex].id);
    }
}

function decrementMonsterCount(playerId) {
    const player = players.find(p => p.id === playerId);
    player.monsterCount--;
    player.monstersLost++;
    if (player.monstersLost >= maxMonsterRemovals && player.monstersPlaced >= maxMonsters) {
        eliminatePlayer(player);
    }
}

function eliminatePlayer(player) {
    positions.push(player.name);
    players.splice(players.indexOf(player), 1);
    eliminatedList.innerHTML += `<p>${player.name}</p>`;
    showMessage(`${player.name} was eliminated!`);
    if (players.length === 1) {
        positions.push(players[0].name);
        showMessage(`${players[0].name} won the game!`);
        displayPositions();
        saveGame(true);
    } else {
        updateStatus();
        if (currentPlayerIndex >= players.length) {
            currentPlayerIndex = 0;
        }
        updateCurrentPlayer();
    }
}

function displayPositions() {
    let positionText = 'Final Positions:\n';
    positions.reverse().forEach((player, index) => {
        positionText += `${index + 1}. ${player}\n`;
    });
    showMessage(positionText);
}

function updateStatus() {
    let statusText = '';
    players.forEach(player => {
        statusText += `${player.name}: ${player.monsterCount} monsters on board, ${maxMonsters - player.monstersPlaced} monsters left to place, ${player.monstersLost} monsters lost\n`;
    });
    statsDiv.innerText = statusText;
}

function resetGame() {
    location.reload();
    // Display buttons on home screen when restarting the game
    document.getElementById('insert-monster').style.display = 'none';
    document.getElementById('move-monster').style.display = 'none';
    document.getElementById('skip-turn').style.display = 'none';
}

function skipTurn() {
    endTurn();
}

function showMessage(message) {
    messageText.innerText = message;
    messageModal.style.display = 'block';
}

function closeMessage() {
    messageModal.style.display = 'none';
}

function showRules() {
    rulesModal.style.display = 'block';
}

function closeRules() {
    rulesModal.style.display = 'none';
}

function showStats() {
    fetch('/api/game-stats')
        .then(response => response.json())
        .then(data => {
            // <p>Winner: ${game?.positions[0]}</p>
            gameStatsDiv.innerHTML = '';
            data.forEach(game => {
                const gameDiv = document.createElement('div');
                gameDiv.innerHTML = `
                    <h3>Game ${game._id}</h3>
                    <p>Players: ${game.players.join(', ')}</p>
                    <p>Positions: ${game.positions.join(', ')}</p>
                    <p>Status: ${game.status}</p>
                `;
                gameStatsDiv.appendChild(gameDiv);
            });
            statsModal.style.display = 'block';
        });
}

function closeStats() {
    statsModal.style.display = 'none';
}

function saveGame(completed) {
    const gameData = {
        players: players.map(player => player.name),
        positions,
        status: completed ? 'Completed' : 'Not Completed',
    };

    fetch('/api/save-game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
    });
}
