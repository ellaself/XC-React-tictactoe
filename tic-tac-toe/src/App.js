import { useEffect, useMemo, useState } from "react";

/**
 * Tic-Tac-Toe (Challenges 1–7)
 * - Challenge 1: regex winner check for 3x3 (no loop in the regex-based winner calc)
 * - Challenge 2: reset button
 * - Challenge 3: automate player O after X (when human is X)
 * - Challenge 4: switch player button (computer moves for current player, then human plays opposite)
 * - Challenge 5: minimax (recursive) for findBestMove()
 * - Challenge 6: variable board size n×m, win length k = min(n, m)
 * - Challenge 7: resize during play by mapping old board into new board
 */

/* =========================
   Presentational Components
========================= */

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick} type="button">
      {value}
    </button>
  );
}

function SizePicker({ rows, cols, setRows, setCols, onApply }) {
  const winLen = Math.min(rows, cols);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <label>
        Rows:&nbsp;
        <input
          type="number"
          min={1}
          max={10}
          value={rows}
          onChange={(e) => setRows(clampInt(e.target.value, 1, 10))}
          style={{ width: 70 }}
        />
      </label>

      <label>
        Cols:&nbsp;
        <input
          type="number"
          min={1}
          max={10}
          value={cols}
          onChange={(e) => setCols(clampInt(e.target.value, 1, 10))}
          style={{ width: 70 }}
        />
      </label>

      <button onClick={onApply} type="button">
        Apply Size
      </button>

      <span style={{ opacity: 0.8 }}>
        Win = <strong>{winLen}</strong> in a row
      </span>
    </div>
  );
}

function Board({ squares, rows, cols, onClickSquare, status, winner }) {
  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gridTemplateColumns: `repeat(${cols}, 44px)`,
      gap: 6,
      marginTop: 12,
    }),
    [cols]
  );

  return (
    <>
      <div className="status">{status}</div>
      {winner ? <p className="congrats">Congratulations!! You Win!</p> : null}

      <div style={gridStyle}>
        {squares.map((value, i) => (
          <Square
            key={i}
            value={value}
            onSquareClick={() => onClickSquare(i)}
          />
        ))}
      </div>
    </>
  );
}

/* =========================
   Game (All Challenges)
========================= */

export default function Game() {
  // Challenge 6 + 7: board size draft + live size (default 3x3)
  const [rowsDraft, setRowsDraft] = useState(3);
  const [colsDraft, setColsDraft] = useState(3);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const size = rows * cols;
  const k = Math.min(rows, cols);

  // Time travel
  const [history, setHistory] = useState([Array(size).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [xIsNext, setXIsNext] = useState(true);

  // Challenge 4: which side the HUMAN plays
  const [humanPlayer, setHumanPlayer] = useState("X");

  const currentSquares = history[currentMove];
  const currentPlayer = xIsNext ? "X" : "O";
  const isLatestMove = currentMove === history.length - 1;

  // Challenge 1 + 6: winner (regex only for 3x3; otherwise generalized scan)
  const winner = calculateWinner(currentSquares, rows, cols, k);

  const isBoardFull = useMemo(
    () => currentSquares.every((s) => s !== null),
    [currentSquares]
  );

  const status = useMemo(() => {
    if (winner) return `Winner: ${winner}`;
    if (isBoardFull) return "Tie game!";
    return `Next player: ${currentPlayer}`;
  }, [winner, isBoardFull, currentPlayer]);

  /* ===== Challenge 2: Reset ===== */

  function resetGame(nextRows = rows, nextCols = cols) {
    const nextSize = nextRows * nextCols;
    setHistory([Array(nextSize).fill(null)]);
    setCurrentMove(0);
    setXIsNext(true);
    setHumanPlayer("X");
  }

  /* ===== Challenge 7: Resize during play with mapping ===== */

  function applySize() {
    const newRows = rowsDraft;
    const newCols = colsDraft;

    const mappedSquares = mapBoard(
      currentSquares,
      rows,
      cols,
      newRows,
      newCols
    );

    // Keep it sane: reset history to the mapped current position.
    setRows(newRows);
    setCols(newCols);
    setHistory([mappedSquares]);
    setCurrentMove(0);

    // Infer next turn based on counts
    const xCount = mappedSquares.filter((s) => s === "X").length;
    const oCount = mappedSquares.filter((s) => s === "O").length;
    setXIsNext(xCount === oCount);
  }

  /* ===== Time travel + play ===== */

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
    setXIsNext((prev) => !prev);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
    setXIsNext(nextMove % 2 === 0);
  }

  /* ===== Human click ===== */

  function onClickSquare(i) {
    if (winner) return;
    if (currentSquares[i]) return;

    // Only allow clicks when it's the human's turn
    if (currentPlayer !== humanPlayer) return;

    const nextSquares = currentSquares.slice();
    nextSquares[i] = currentPlayer;
    handlePlay(nextSquares);
  }

  /* ===== Challenge 3: Auto O after X (when human is X) ===== */

  useEffect(() => {
    if (!isLatestMove) return;
    if (winner) return;
    if (isBoardFull) return;

    // If the human is X, the computer plays O on O's turns
    if (humanPlayer === "X" && currentPlayer === "O") {
      const best = findBestMoveMinimax(currentSquares, rows, cols, k, "O");
      if (best === null) return;

      const nextSquares = currentSquares.slice();
      nextSquares[best] = "O";
      handlePlay(nextSquares);
    }
  }, [
    isLatestMove,
    winner,
    isBoardFull,
    humanPlayer,
    currentPlayer,
    currentSquares,
    rows,
    cols,
    k,
  ]);

  /* ===== Challenge 4: Switch Player button ===== */

  function switchPlayerAndComputerMove() {
    if (winner) return;
    if (isBoardFull) return;

    const best = findBestMoveMinimax(currentSquares, rows, cols, k, currentPlayer);
    if (best === null) return;

    const nextSquares = currentSquares.slice();
    nextSquares[best] = currentPlayer;
    handlePlay(nextSquares);

    // After computer plays current player, human becomes the opposite
    setHumanPlayer(opponentOf(currentPlayer));
  }

  const moves = useMemo(
    () =>
      history.map((_, move) => {
        const description = move > 0 ? `Go to move #${move}` : "Go to game start";
        return (
          <li key={move}>
            <button onClick={() => jumpTo(move)} type="button">
              {description}
            </button>
          </li>
        );
      }),
    [history]
  );

  return (
    <div className="game">
      <div className="game-board">
        <SizePicker
          rows={rowsDraft}
          cols={colsDraft}
          setRows={setRowsDraft}
          setCols={setColsDraft}
          onApply={applySize}
        />

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => resetGame()} type="button">
            Reset
          </button>

          <button onClick={switchPlayerAndComputerMove} type="button">
            Switch to Player {opponentOf(humanPlayer)}
          </button>

          <span style={{ marginLeft: 6, opacity: 0.85 }}>
            Human: <strong>{humanPlayer}</strong>
          </span>
        </div>

        <Board
          squares={currentSquares}
          rows={rows}
          cols={cols}
          onClickSquare={onClickSquare}
          status={status}
          winner={winner}
        />
      </div>

      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

/* =========================
   Challenge 1 + 6: Winner
========================= */

/**
 * calculateWinner
 * - For 3x3: Challenge 1 regex approach (no loop inside the regex check)
 * - For n×m: Challenge 6 generalized scan for k = min(n, m) in a row
 */
function calculateWinner(squares, rows, cols, k) {
  if (rows === 3 && cols === 3 && k === 3) {
    return calculateWinnerRegex3x3(squares);
  }

  // Directions: right, down, diag down-right, diag down-left
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const start = squares[idx(r, c, cols)];
      if (!start) continue;

      for (const [dr, dc] of directions) {
        let ok = true;

        for (let step = 1; step < k; step += 1) {
          const rr = r + dr * step;
          const cc = c + dc * step;

          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) {
            ok = false;
            break;
          }

          if (squares[idx(rr, cc, cols)] !== start) {
            ok = false;
            break;
          }
        }

        if (ok) return start;
      }
    }
  }

  return null;
}

/**
 * Challenge 1 regex for 3x3 only.
 * Uses '-' for empty squares.
 */
function calculateWinnerRegex3x3(squares) {
  const re =
    /^(?:(?:...){0,2}([OX])\1\1|.{0,2}([OX])..\2..\2|([OX])...\3...\3|..([OX]).\4.\4)/g;

  const flat = squares.map((s) => s ?? "-").join("");

  // /g regex is stateful — reset before exec
  re.lastIndex = 0;

  const match = re.exec(flat);
  if (!match) return null;

  return match[1] || match[2] || match[3] || match[4] || null;
}

/* =========================
   Challenge 5: Minimax AI
========================= */

/**
 * findBestMoveMinimax
 * - returns the best move index for `player`
 * - implements minimax(board, depth, isMaximizing)
 *
 * Note: For boards bigger than 3x3, the game tree explodes.
 * We use a depth cap to keep the app responsive.
 */
function findBestMoveMinimax(squares, rows, cols, k, player) {
  const empties = getEmptyIndices(squares);
  if (empties.length === 0) return null;

  const maxDepth = squares.length <= 9 ? 99 : 5;

  let bestMove = null;
  let bestScore = player === "X" ? -Infinity : Infinity;

  for (const i of empties) {
    squares[i] = player;

    const score = minimax(
      squares,
      rows,
      cols,
      k,
      0,
      player === "X",
      maxDepth
    );

    squares[i] = null;

    if (player === "X") {
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    } else {
      if (score < bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove ?? empties[0];
}

/**
 * minimax(board, depth, isMaximizing)
 * Terminal:
 *  - X win => positive score
 *  - O win => negative score
 *  - draw => 0
 */
function minimax(board, rows, cols, k, depth, isMaximizing, maxDepth) {
  const winner = calculateWinner(board, rows, cols, k);

  // Terminal checks
  if (winner === "X") return 10 - depth;
  if (winner === "O") return depth - 10;
  if (isDraw(board)) return 0;

  if (depth >= maxDepth) return 0;

  let bestScore = isMaximizing ? -Infinity : Infinity;

  for (const i of getEmptyIndices(board)) {
    board[i] = isMaximizing ? "X" : "O";

    const score = minimax(
      board,
      rows,
      cols,
      k,
      depth + 1,
      !isMaximizing,
      maxDepth
    );

    board[i] = null;

    if (isMaximizing) {
      bestScore = Math.max(bestScore, score);
    } else {
      bestScore = Math.min(bestScore, score);
    }
  }

  return bestScore;
}

/* =========================
   Challenge 7: Resize Mapping
========================= */

/**
 * mapBoard
 * Sensible mapping: copy the overlapping top-left rectangle
 * old (r,c) -> new (r,c) for r < minRows and c < minCols
 */
function mapBoard(oldSquares, oldRows, oldCols, newRows, newCols) {
  const newSquares = Array(newRows * newCols).fill(null);

  const rMax = Math.min(oldRows, newRows);
  const cMax = Math.min(oldCols, newCols);

  for (let r = 0; r < rMax; r += 1) {
    for (let c = 0; c < cMax; c += 1) {
      const oldIndex = r * oldCols + c;
      const newIndex = r * newCols + c;
      newSquares[newIndex] = oldSquares[oldIndex];
    }
  }

  return newSquares;
}

/* =========================
   Helpers
========================= */

function idx(r, c, cols) {
  return r * cols + c;
}

function opponentOf(player) {
  return player === "X" ? "O" : "X";
}

function getEmptyIndices(board) {
  const out = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === null) out.push(i);
  }
  return out;
}

function isDraw(board) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === null) return false;
  }
  return true;
}

function clampInt(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}