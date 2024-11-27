class BingoGame {
    constructor() {
        this.board = Array(5).fill().map(() => Array(5).fill(0));
        this.moveHistory = [];
        this.suggestion = null;
        this.targetLines = 5;
        this.maxMoves = 16;
        this.init();
    }

    init() {
        this.createBoard();
        this.updateUI();
        document.getElementById('undoButton').addEventListener('click', () => this.undo());
        document.getElementById('resetButton').addEventListener('click', () => this.reset());
    }

    evaluatePosition(row, col) {
        let score = 0;
        const testBoard = this.board.map(row => [...row]);
        testBoard[row][col] = 1;

        // ตรวจสอบการทำบิงโก 5 แถว
        const currentBingos = this.checkBingo();
        const newBingos = this.checkBingoForBoard(testBoard);
        if (newBingos > currentBingos) {
            score += 15000;
        }

        // ให้คะแนนตำแหน่งกลางและมุม
        if (row === 2 && col === 2) {
            score += 1000;
        } else if ((row === 0 || row === 4) && (col === 0 || col === 4)) {
            score += 800;
        }

        // ตรวจสอบโอกาสทำแถวแนวทแยง
        if (this.canFormDiagonal(testBoard, row, col)) {
            score += 1200;
        }

        // ตรวจสอบการสร้างรูปแบบ L หรือ T
        if (this.canFormLorT(testBoard, row, col)) {
            score += 900;
        }

        // ตรวจสอบการบล็อกคู่ต่อสู้
        score += this.evaluateBlocking(row, col) * 700;

        // ให้คะแนนการวางติดกัน
        score += this.evaluateAdjacent(row, col) * 500;

        // คะแนนพิเศษสำหรับการทำหลายแถวในคราวเดียว
        score += this.evaluateMultipleLines(testBoard, row, col) * 1100;

        // ปรับคะแนนตามจำนวนตาที่เหลือ
        const movesLeft = this.maxMoves - this.moveHistory.length;
        if (movesLeft < 5) {
            score *= 1.5; // เพิ่มความเร่งด่วนในการตัดสินใจ
        }

        return score;
    }

    canFormDiagonal(board, row, col) {
        const diag1 = row === col;
        const diag2 = row + col === 4;
        let diagCount = 0;

        if (diag1) {
            diagCount = board.filter((r, i) => board[i][i] === 1).length;
        }
        if (diag2) {
            diagCount = board.filter((r, i) => board[i][4 - i] === 1).length;
        }

        return diagCount >= 2;
    }

    canFormLorT(board, row, col) {
        const rowCount = board[row].filter(cell => cell === 1).length;
        const colCount = board.map(r => r[col]).filter(cell => cell === 1).length;
        return (rowCount >= 2 && colCount >= 2);
    }

    evaluateBlocking(row, col) {
        let blockScore = 0;
        const rowCount = this.board[row].filter(cell => cell === 1).length;
        const colCount = this.board.map(r => r[col]).filter(cell => cell === 1).length;

        if (rowCount === 3) blockScore += 2;
        if (colCount === 3) blockScore += 2;

        return blockScore;
    }

    evaluateAdjacent(row, col) {
        let adjacentCount = 0;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (let [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
                if (this.board[newRow][newCol] === 1) {
                    adjacentCount++;
                }
            }
        }

        return adjacentCount;
    }

    evaluateMultipleLines(board, row, col) {
        let lineCount = 0;

        // ตรวจสอบแนวนอน
        if (board[row].filter(cell => cell === 1).length >= 3) lineCount++;

        // ตรวจสอบแนวตั้ง
        if (board.map(r => r[col]).filter(cell => cell === 1).length >= 3) lineCount++;

        // ตรวจสอบแนวทแยง
        if (row === col && board.filter((r, i) => board[i][i] === 1).length >= 3) lineCount++;
        if (row + col === 4 && board.filter((r, i) => board[i][4 - i] === 1).length >= 3) lineCount++;

        return lineCount;
    }

    handleCellClick(row, col) {
        if (this.board[row][col] === 0 && this.moveHistory.length < this.maxMoves) {
            this.moveHistory.push([row, col]);
            this.board[row][col] = 1;
            this.suggestion = this.findBestMove();
            this.updateUI();
        }
    }

    updateUI() {
        this.createBoard();
        const currentBingo = this.checkBingo();
        const movesLeft = this.maxMoves - this.moveHistory.length;

        document.getElementById('bingoCount').textContent =
            `จำนวนบิงโกที่ได้: ${currentBingo} (เหลือ ${movesLeft} ตา)`;

        document.getElementById('undoButton').disabled = this.moveHistory.length === 0;

        const suggestionText = this.suggestion
            ? `แนะนำตำแหน่งถัดไป: ช่องที่ ${this.suggestion[0] * 5 + this.suggestion[1] + 1}`
            : movesLeft === 0 ? 'เกมจบแล้ว!' : 'เริ่มเกมโดยคลิกที่ช่องที่ต้องการ';
        document.getElementById('suggestion').textContent = suggestionText;
    }

    // เมธอดที่เหลือคงเดิม...
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

    findBestMove() {
        if (this.moveHistory.length >= this.maxMoves) return null;

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

new BingoGame();

function showNotes() {
    document.getElementById('notesDialog').classList.add('show');
}

function hideNotes() {
    document.getElementById('notesDialog').classList.remove('show');
}

document.getElementById('notesDialog').addEventListener('click', function (e) {
    if (e.target === this) {
        hideNotes();
    }
});