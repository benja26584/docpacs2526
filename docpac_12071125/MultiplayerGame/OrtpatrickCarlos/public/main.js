//dom elements
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let playerSymbol = null;
    let gameActive = false;


    // Get game code from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const gameCode = urlParams.get('code');

    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const statusDiv = document.getElementById('status');
    const resetButton = document.getElementById('reset');


    //join game room if game code is present in URL
    if (gameCode) {
        socket.emit('joinGameCode', gameCode);
    }

    // Handle cell clicks
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            console.log('Cell clicked!'); // Add this first
            console.log('gameActive:', gameActive); // Check this value
            console.log('cell.textContent:', cell.textContent); // Check if empty
            console.log('playerSymbol:', playerSymbol); // Check if assigned
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
    });

    // Handle server events
    socket.on('playerAssigned', (data) => {
        playerSymbol = data.symbol;
        gameActive = true;
        if (statusDiv) {
            statusDiv.textContent = `You are player ${playerSymbol}. Game code: ${data.gameCode}`;
        }
    });

    socket.on('updateGame', (gameState) => {
        if (statusDiv) {
            if (gameState.winner === 'Draw') {
                statusDiv.textContent = 'The game is a draw!';
            } else if (gameState.winner) {
                statusDiv.textContent = `Player ${gameState.winner} wins!`;
            } else {
                statusDiv.textContent = `Player ${gameState.currentPlayer}'s turn.`;
            }
        } else {
            console.error('Element with id "status" not found in the DOM.');
        }
    
        // Update the board
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            cell.textContent = gameState.board[row][col] || '';
        });
    
        // Show the reset button if there is a winner or a draw
        if (gameState.winner) {
            resetButton.style.display = 'block';
        }
    });


    socket.on('resetGame', () => {
        gameActive = true; // Reset the game state
        if (statusDiv) {
            statusDiv.textContent = 'Game reset. Waiting for moves...';
        } else {
            console.error('Element with id "status" not found in the DOM.');
        }
        cells.forEach(cell => (cell.textContent = '')); // Clear the game board
        resetButton.style.display = 'none'; // Hide the reset button for all players
    });
    
    socket.on('error', (message) => {
        console.log('Error received:', message);
        if (statusDiv) {
            statusDiv.textContent = message;
        }
    });
    
    });





console.log('Connected to the game server.');

