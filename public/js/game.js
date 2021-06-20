class GameProcessor {
    #guards;
    #runners;
    #gameState;
    constructor(p1, p2) {
        this.players = [p1, p2];
        this.turn;
        this.config = {
            starting_player: 1,
            player_colors: ["red", "blue"],
        }
        this.#runners = [];
        this.#guards = [];
        this.#gameState = false;
    }
    move(playerIndex, S, x2, y2) {
        if (this.#gameState == false) return false;
        if (!this.isMoveLegal(S, x2, y2)) return false;
        if (this.turn != playerIndex) return false;

        if (S.color == "black") {
            if (this.#guards[S.x][S.y].player != playerIndex) return false;
            this.#guards[x2][y2] = {
                player: playerIndex
            };
            this.#guards[S.x][S.y] = false;

        } else {
            if (this.#runners[S.x][S.y].player != playerIndex) return false;
            this.#runners[x2][y2] = {
                player: playerIndex
            };
            this.#runners[S.x][S.y] = false;
        }
        this.checkForCaptures();
        if (playerIndex == 1) this.turn = 2;
        if (playerIndex == 2) this.turn = 1;
        if (this.checkWinner()) {
            this.turn = false;
            this.#gameState = false;
        }
        return true;
    }
    getGameState() { return this.#gameState }
    checkWinner() {
        var winner = false;
        var runner_count = [false, 0, 0];
        this.#runners.map((column, x) => column.map((item, y) => {
            if (item) {
                runner_count[item.player]++;
                if (item.player == 1 && y == 0) winner = 1;
                if (item.player == 2 && y == 6) winner = 2;
            }
        }));
        if (runner_count[1] == 0) winner = 2;
        if (runner_count[2] == 0) winner = 1;

        if (winner) this.#gameState = false;
        return winner;
    }
    checkForCaptures() {
        this.#runners.map((column, x) => column.map((item, y) => {

            var surrounding_guards = 0;
            if (x < 6 && y < 6 && this.#guards[x][y] && this.#guards[x][y].player != item.player) surrounding_guards++;
            if (x - 1 >= 0 && y < 6 && this.#guards[x - 1][y] && this.#guards[x - 1][y].player != item.player) surrounding_guards++;
            if (x < 6 && y - 1 >= 0 && this.#guards[x][y - 1] && this.#guards[x][y - 1].player != item.player) surrounding_guards++;
            if (x - 1 >= 0 && y - 1 >= 0 && this.#guards[x - 1][y - 1] && this.#guards[x - 1][y - 1].player != item.player) surrounding_guards++;

            if (surrounding_guards >= 2) this.#runners[x][y] = false;
        }))
    }
    isMoveLegal(S, x2, y2) {
        var piece = this.getPiece(S);
        if (piece.player != this.turn) return false;
        var moves = S.color == "black" ? possibleGuardMoves(this.#guards, S.x, S.y) : possibleRunnerMoves(this.#runners, S.x, S.y);
        var legality = false;
        moves.map((item) => {
            if (item.x == x2 && item.y == y2) {
                legality = true;
            }
        })
        return legality;
    }
    startGame() {
        this.turn = this.config.starting_player;
        this.#gameState = true;
        this.#runners.map((column, x) => column.map((item, y) => {
            this.#runners[x][y] = false;
        }))
        this.#guards.map((column, x) => column.map((item, y) => {
            this.#guards[x][y] = false;
        }))

        for (var x = 0; x < 7; x++) {
            this.#runners[x] = new Array(7);
            for (var y = 0; y < 7; y++) {
                this.#runners[x][y] = false;
            }
        }
        for (var x = 0; x < 6; x++) {
            this.#guards[x] = new Array(6);
            for (var y = 0; y < 6; y++) {
                this.#guards[x][y] = false;
            }
        }
        //starting positions for pieces
        for (var i = 1; i <= 5; i++) {
            this.#runners[i][0] = {
                player: 2
            }
            this.#runners[i][6] = {
                player: 1
            }
        }
        for (var i = 1; i <= 4; i++) {
            this.#guards[i][0] = {
                player: 2
            }
            this.#guards[i][5] = {
                player: 1
            }
        }
    }
    handlePieces(cb) {
        cb(this.#runners, this.#guards)
    }
    getPiece(S) {
        if (S.color == "black") {
            return this.#guards[S.x][S.y];
        } else {
            return this.#runners[S.x][S.y];
        }
    }
    getRunners() {
        return this.#runners;
    }
    getGuards() {
        return this.#guards;
    }
}
class GameClient {
    constructor(playerIndex, gameWindowId) {
        this.playerIndex = playerIndex;

        this.GW = new GameWindow(gameWindowId, playerIndex == 2);
        this.turn = false;
        this.selected = false;

    }
    get sq_gap() {
        return this.GW.B.sq_gap;
    }
}
class GameWindow {
    reversed;
    constructor(id, reversed) {
        this.id = id;
        this.el = document.getElementById(this.id);
        this.reversed = reversed;

        this.B = new Board(this.el.getElementsByClassName('gameBoard')[0]);
        this.P = new Pieces(this.el.getElementsByClassName('gamePieces')[0]);

        if (reversed) {
            this.P.el.setAttribute('style', 'transform:rotate(180deg);')
            this.B.el.setAttribute('style', 'transform:rotate(180deg);')
        }

    }
    onClick(cb) {
        this.el.addEventListener('mousedown', (e) => {
            const rect = this.el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            var out = this.coordinateToSquare(x, y);
            if (this.reversed) {
                out.x = out.color == 'black' ? 5 - out.x : 6 - out.x;
                out.y = out.color == 'black' ? 5 - out.y : 6 - out.y;
            }
            cb(out);
        })
    }
    coordinateToSquare(x, y) {
        var gap = Math.round(this.B.sq_gap);
        var half_gap = 0.5 * gap;
        var Bx = Math.round(x / gap) * gap;
        var By = Math.round(y / gap) * gap;
        var Wx = Math.abs(x - (Bx - half_gap)) < Math.abs(x - (Bx + half_gap)) ? Bx - half_gap : Bx + half_gap;
        var Wy = Math.abs(y - (By - half_gap)) < Math.abs(y - (By + half_gap)) ? By - half_gap : By + half_gap;
        var bow = Math.hypot(x - Bx, y - By) < Math.hypot(x - Wx, y - Wy) ? "black" : "white";
        return {
            color: bow,
            x: bow == "black" ? (Bx - gap) / gap : (Wx - half_gap) / gap,
            y: bow == "black" ? (By - gap) / gap : (Wy - half_gap) / gap
        }
    }
}
class Board {
    constructor(el) {
        this.el = el;
        this.ctx = this.el.getContext('2d');
        this.colors = {
            white_square: "#ffe0c8",
            black_square: ["#1e1711", "#d99a64"],
            white_highlight: "rgba(41, 204, 174, 0.45)",
            black_highligth: "rgba(41, 204, 174, 0.25)"
        };
    }
    get sq_gap() {
        return this.el.width / 7;
    }
    drawBoard() {
        var gap = this.sq_gap;

        //Create black background gradient
        var grd = this.ctx.createLinearGradient(0, 8 * gap, 0, -3 * gap);
        grd.addColorStop(0, this.colors.black_square[0]);
        grd.addColorStop(1, this.colors.black_square[1]);

        this.ctx.fillStyle = grd;
        this.ctx.fillRect(gap / 2, gap / 2, 6 * gap, 6 * gap);

        this.ctx.lineWidth = 0;
        //Draw white squares
        for (var y = 0; y < 7; y++) for (var x = 0; x < 7; x++) {
            this.drawSquare({
                color: 'white',
                x: x,
                y: y
            }, this.colors.white_square);
        }
    }
    drawSquare(D, color) {  //X and Y are in order of "gaps"
        var x, y;
        if (D.color == "white") {
            x = D.x; y = D.y;
        } else if (D.color == "black") {
            x = D.x + 0.5; y = D.y + 0.5;
        }
        var gap = this.sq_gap;
        this.ctx.beginPath();
        this.ctx.moveTo(x * gap + gap / 2, y * gap + 0);
        this.ctx.lineTo(x * gap + gap, y * gap + gap / 2);
        this.ctx.lineTo(x * gap + gap / 2, y * gap + gap);
        this.ctx.lineTo(x * gap + 0, y * gap + gap / 2);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.stroke();
        this.ctx.fill();
        this.ctx.closePath();
    }

}
class Pieces {
    constructor(el) {
        this.el = el;
        this.ctx = this.el.getContext('2d');
        this.runners = [];
        this.guards = [];

        this.config = {
            "animation_step": 1,
            "animation_delay": 1
        };

        this.init_pieces();
    }
    get sq_gap() {
        return this.el.width / 7;
    }
    init_pieces() {
        for (var x = 0; x < 7; x++) {
            this.runners[x] = new Array(7);
            for (var y = 0; y < 7; y++) {
                this.runners[x][y] = false;
            }
        }
        for (var x = 0; x < 6; x++) {
            this.guards[x] = new Array(6);
            for (var y = 0; y < 6; y++) {
                this.guards[x][y] = false;
            }
        }
    }
    drawRunner(x, y, color) {
        this.ctx.save()

        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        this.ctx.arc(x, y, 13, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
        this.ctx.lineWidth = 1;
        this.ctx.arc(x, y, 13, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();


        this.ctx.restore();
    }
    drawGuard(x, y, color) {
        this.ctx.save();

        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 6;
        this.ctx.strokeStyle = "rgba(0,0,0,0.5)";
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.closePath();

        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.stroke();

        this.ctx.restore()
    }
    clear() { this.ctx.clearRect(0, 0, this.el.width, this.el.height) }
    render() {
        var gap = this.sq_gap;
        for (var x = 0; x < 7; x++) for (var y = 0; y < 7; y++) {
            var item = this.runners[x][y];
            if (item) {
                this.drawRunner(x * gap + 0.5 * gap + item.offsetX, y * gap + 0.5 * gap + item.offsetY, item.color);
            }
        };
        for (var x = 0; x < 6; x++) for (var y = 0; y < 6; y++) {
            var item = this.guards[x][y];
            if (item) {
                this.drawGuard(x * gap + gap + item.offsetX, y * gap + gap + item.offsetY, item.color);
            }
        }
    }

    //Lord forgive me for the following repeat code
    //Could be tidier but not sure if the V8 engine would optimize it well
    //though performance hardly matters in such a short animation
    moveGuardX(x, y, dx, cb) {
        if (!this.guards[x + dx][y] && this.guards[x][y]) {
            var end = Math.abs(dx) * this.sq_gap;
            var interval = setInterval(() => {
                dx < 0 ? --this.guards[x][y].offsetX : ++this.guards[x][y].offsetX;
                this.clear();
                this.render();
                end--;
                if (end <= 0) {
                    clearInterval(interval);
                    var temp = this.guards[x][y];
                    temp.offsetX = 0;
                    this.guards[x + dx][y] = temp;
                    this.guards[x][y] = false;
                    this.clear();
                    this.render();
                    cb();
                }
            }, this.config.animation_delay);
        }
    }
    moveGuardY(x, y, dy, cb) {
        if (!this.guards[x][y + dy] && this.guards[x][y]) {
            var end = Math.abs(dy) * this.sq_gap;
            var interval = setInterval(() => {
                dy < 0 ? this.guards[x][y].offsetY -= this.config.animation_step :
                    this.guards[x][y].offsetY += this.config.animation_step;
                this.clear();
                this.render();
                end--;
                if (end <= 0) {
                    clearInterval(interval);
                    var temp = this.guards[x][y];
                    temp.offsetY = 0;
                    this.guards[x][y + dy] = temp;
                    this.guards[x][y] = false;
                    this.clear();
                    this.render();
                    cb()
                }
            }, this.config.animation_delay);
        }
    }
    moveRunnerX(x, y, dx, cb) {
        if (!this.runners[x + dx][y] && this.runners[x][y]) {
            var end = Math.abs(dx) * this.sq_gap;
            var interval = setInterval(() => {
                dx < 0 ? this.runners[x][y].offsetX -= this.config.animation_step :
                    this.runners[x][y].offsetX += this.config.animation_step;
                this.clear();
                this.render();
                end--;
                if (end <= 0) {
                    clearInterval(interval);
                    var temp = this.runners[x][y];
                    temp.offsetX = 0;
                    this.runners[x + dx][y] = temp;
                    this.runners[x][y] = false;
                    this.clear();
                    this.render();
                    cb();
                }
            }, this.config.animation_delay);
        }
    }
    moveRunnerY(x, y, dy, cb) {
        if (!this.runners[x][y + dy] && this.runners[x][y]) {
            var end = Math.abs(dy) * this.sq_gap;
            var interval = setInterval(() => {
                dy < 0 ? this.runners[x][y].offsetY -= this.config.animation_step
                    : this.runners[x][y].offsetY += this.config.animation_step;
                this.clear();
                this.render();
                end -= this.config.animation_step;
                if (end <= 0) {
                    clearInterval(interval);
                    var temp = this.runners[x][y];
                    temp.offsetY = 0;
                    this.runners[x][y + dy] = temp;
                    this.runners[x][y] = false;
                    this.clear();
                    this.render();
                    cb();
                }
            }, this.config.animation_delay);
        }
    }
    move(S, x2, y2, cb) {
        var d;
        var xory;
        if (x2 != S.x) {
            d = x2 - S.x;
            xory = "x";
        } else {
            d = y2 - S.y;
            xory = "y";
        }
        S.color == "black" ?
            (xory == "x" ? this.moveGuardX(S.x, S.y, d, cb) : this.moveGuardY(S.x, S.y, d, cb)) :
            (xory == "x" ? this.moveRunnerX(S.x, S.y, d, cb) : this.moveRunnerY(S.x, S.y, d, cb));
    }
}
function possibleRunnerMoves(runners, x, y) {
    var runner = runners[x][y];
    if (runner == false) {
        return false;
    }
    var moves = [];
    if (x > 0 && !runners[x - 1][y]) {
        moves.push({
            x: x - 1,
            y: y
        });
    }
    if (x < 7 && !runners[x + 1][y]) {
        moves.push({
            x: x + 1,
            y: y
        });
    }

    var dy = runner.player == 1 ? -1 : 1; //calculate player relative delta y
    if (y + dy < 7 && y + dy > 0 && !runners[x][y + dy]) {
        moves.push({
            x: x,
            y: y + dy
        });
    }
    return moves;

}
function possibleGuardMoves(guards, x, y) {
    var guard = guards[x][y];
    if (guard == false) {
        return false;
    }
    var moves = [];

    for (var dy = y + 1; dy < 6; dy++) {
        if (!guards[x][dy]) {
            moves.push({
                x: x,
                y: dy
            })
        } else {
            break;
        }
    }
    for (var dy = y - 1; dy >= 0; dy--) {
        if (!guards[x][dy]) {
            moves.push({
                x: x,
                y: dy
            })
        } else {
            break;
        }
    }
    for (var dx = x + 1; dx < 6; dx++) {
        if (!guards[dx][y]) {
            moves.push({
                x: dx,
                y: y
            })
        } else {
            break;
        }
    }
    for (var dx = x - 1; dx >= 0; dx--) {
        if (!guards[dx][y]) {
            moves.push({
                x: dx,
                y: y
            })
        } else {
            break;
        }
    }
    return moves;
}