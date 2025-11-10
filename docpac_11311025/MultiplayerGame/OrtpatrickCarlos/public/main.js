//dom elements
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let playerSymbol = null;
    let gameActive = false;

    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const statusDiv = document.getElementById('status');
    const resetButton = document.getElementById('reset');

    // Handle cell clicks
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            if (gameActive && cell.textContent === '' && playerSymbol) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                socket.emit('makeMove', { row, col });
            }
        });
    });

    // Handle reset button click
    resetButton.addEventListener('click', () => {
        socket.emit('resetGame');
        resetButton.style.display = 'none';
    });


    // Handle server events
    socket.on('assignSymbol', (symbol) => {
        playerSymbol = symbol;
        gameActive = true;
        if (statusDiv) {
            statusDiv.textContent = `You are player ${playerSymbol}.`;
        }
    });

    socket.on('updateGame', (gameState) => {
        if (statusDiv) {
            statusDiv.textContent = gameState.winner
                ? `Player ${gameState.winner} wins!`
                : `Player ${gameState.currentPlayer}'s turn.`;
        } else {
            console.error('Element with id "status" not found in the DOM.');
        }
    
        // Update the board
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.textContent = gameState.board[row][col] || '';
        });
    
        // Show the reset button if there is a winner
        if (gameState.winner) {
            resetButton.style.display = 'block';
        }
    });


    socket.on('resetGame', () => {
        gameActive = true;
        if (statusDiv) {
            statusDiv.textContent = 'Game reset. Waiting for moves...';
        } else {
            console.error('Element with id "status" not found in the DOM.');
        }
        cells.forEach(cell => (cell.textContent = ''));
    });
    
    socket.on('gameFull', () => {
        if (statusDiv) {
            statusDiv.textContent = 'Game is full. Please wait for a player to leave.';
        } else {
            console.error('Element with id "status" not found in the DOM.');
        }
        gameActive = false;
    });
    
    });





console.log('Connected to the game server.');

