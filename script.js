class BingoGame {
    constructor() {
        this.board = Array(5).fill().map(() => Array(5).fill(0));
        this.moveHistory = [];
        this.suggestion = null;
        this.init();
    }

    init() {
        this.createBoard();
        this.updateUI();
        document.getElementById('undoButton').addEventListener('click', () => this.undo());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());
    }

    createBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const row = document.createElement('div');
            row.className = 'flex';

            for (let j = 0; j < 5; j++) {
                const cell = document.createElement('div');
                const cellNumber = i * 5 + j + 1;

                cell.className = `bingo-cell ${this.board[i][j] ? 'marked' : ''} 
                    ${this.suggestion && this.suggestion[0] === i && this.suggestion[1] === j ? 'suggested' : ''}`;

                const numberSpan = document.createElement('span');
                numberSpan.className = 'number';
                numberSpan.textContent = cellNumber;
                cell.appendChild(numberSpan);

                if (this.board[i][j]) {
                    const markSpan = document.createElement('span');
                    markSpan.className = 'mark';
                    markSpan.textContent = 'X';
                    cell.appendChild(markSpan);
                }

                cell.addEventListener('click', () => this.handleCellClick(i, j));
                row.appendChild(cell);
            }

            boardElement.appendChild(row);
        }
    }

    handleCellClick(row, col) {
        if (this.board[row][col] === 0) {
            this.moveHistory.push([row, col]);
            this.board[row][col] = 1;
            this.suggestion = this.findBestMove();
            this.updateUI();
        }
    }

    undo() {
        if (this.moveHistory.length > 0) {
            const [row, col] = this.moveHistory.pop();
            this.board[row][col] = 0;
            this.suggestion = this.findBestMove();
            this.updateUI();
        }
    }

    reset() {
        this.board = Array(5).fill().map(() => Array(5).fill(0));
        this.moveHistory = [];
        this.suggestion = null;
        this.updateUI();
    }

    updateUI() {
        this.createBoard();
        document.getElementById('bingoCount').textContent = `จำนวนบิงโกที่ได้: ${this.checkBingo()}`;
        document.getElementById('undoButton').disabled = this.moveHistory.length === 0;

        const suggestionText = this.suggestion
            ? `แนะนำตำแหน่งถัดไป: ช่องที่ ${this.suggestion[0] * 5 + this.suggestion[1] + 1}`
            : 'เริ่มเกมโดยคลิกที่ช่องที่ต้องการ';
        document.getElementById('suggestion').textContent = suggestionText;
    }

    checkBingo() {
        let count = 0;

        // Check rows
        for (let row of this.board) {
            if (row.every(cell => cell === 1)) count++;
        }

        // Check columns
        for (let j = 0; j < 5; j++) {
            if (this.board.every(row => row[j] === 1)) count++;
        }

        // Check diagonals
        if (Array(5).fill().every((_, i) => this.board[i][i] === 1)) count++;
        if (Array(5).fill().every((_, i) => this.board[i][4 - i] === 1)) count++;

        return count;
    }

    findBestMove() {
        let bestScore = -1;
        let bestMove = null;

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                if (this.board[i][j] === 0) {
                    const score = this.evaluatePosition(i, j);
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = [i, j];
                    }
                }
            }
        }

        return bestMove;
    }

    evaluatePosition(row, col) {
        let score = 0;

        // Test if this move creates a bingo
        const testBoard = this.board.map(row => [...row]);
        testBoard[row][col] = 1;
        if (this.checkBingoForBoard(testBoard) > this.checkBingo()) {
            score += 1000;
        }

        // Check rows and columns
        const rowCount = this.board[row].filter(cell => cell === 1).length;
        const colCount = this.board.map(r => r[col]).filter(cell => cell === 1).length;

        score += rowCount * 10;
        score += colCount * 10;

        // Check diagonals
        if (row === col) {
            const diagCount = Array(5).fill().filter((_, i) => this.board[i][i] === 1).length;
            score += diagCount * 10;
        }
        if (row + col === 4) {
            const antiDiagCount = Array(5).fill().filter((_, i) => this.board[i][4 - i] === 1).length;
            score += antiDiagCount * 10;
        }

        return score;
    }

    checkBingoForBoard(board) {
        let count = 0;

        for (let row of board) {
            if (row.every(cell => cell === 1)) count++;
        }

        for (let j = 0; j < 5; j++) {
            if (board.every(row => row[j] === 1)) count++;
        }

        if (Array(5).fill().every((_, i) => board[i][i] === 1)) count++;
        if (Array(5).fill().every((_, i) => board[i][4 - i] === 1)) count++;

        return count;
    }
}

// Start the game
new BingoGame();

// Note dialog functions
function showNotes() {
    document.getElementById('notesDialog').classList.add('show');
}

function hideNotes() {
    document.getElementById('notesDialog').classList.remove('show');
}

// Close dialog when clicking outside
document.getElementById('notesDialog').addEventListener('click', function (e) {
    if (e.target === this) {
        hideNotes();
    }
});