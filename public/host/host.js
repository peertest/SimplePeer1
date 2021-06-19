const playerIndex = 1;

var Client;
var Game;

function connected() {

    Client = new GameClient(playerIndex, 'gameWindow');
    Game = new GameProcessor('Player 1', 'Player 2');
    Game.startGame();
    Client.GW.B.drawBoard();
    refreshPieces();
    Client.GW.onClick((S) => {
        var piece = Game.getPiece(S);
        if (piece && piece.player == Client.playerIndex && playerIndex == Game.turn) {
            drawSelection(S);
            Client.selected = S;
        } else if (Client.selected && Game.isMoveLegal(Client.selected, S.x, S.y)) {
            sendData({
                from: Client.selected,
                to: {
                    x: S.x,
                    y: S.y
                }
            });
            move(playerIndex, Client.selected, S.x, S.y);
        } else {
            Client.selected = false;
            Client.GW.B.drawBoard();
        }
    })
}

let refreshPieces = () => {
    Game.handlePieces((runners, guards) => {
        runners.map((column, x) => column.map((item, y) => {
            if (item) {
                Client.GW.P.runners[x][y] = {
                    color: Game.config.player_colors[item.player - 1],
                    offsetX: 0,
                    offsetY: 0
                }
            } else {
                Client.GW.P.runners[x][y] = false;
            }
        }));
        guards.map((column, x) => column.map((item, y) => {
            if (item) {
                Client.GW.P.guards[x][y] = {
                    color: Game.config.player_colors[item.player - 1],
                    offsetX: 0,
                    offsetY: 0
                }
            } else {
                Client.GW.P.guards[x][y] = false;
            }
        }));

        Client.GW.P.render();
    });
}
let move = (p, S, x2, y2) => {
    if (Game.move(p, S, x2, y2)) {
        Client.GW.P.move(S, x2, y2, () => {
            Game.checkForCaptures();
            refreshPieces();
        });
        Client.selected = false;
        Client.GW.B.drawBoard();
    }
}
let drawSelection = (S) => {
    Client.GW.B.drawBoard();
    var moves = S.color == "black" ? possibleGuardMoves(Game.getGuards(), S.x, S.y) : possibleRunnerMoves(Game.getRunners(), S.x, S.y);
    moves.map((item) => {
        Client.GW.B.drawSquare({ color: S.color, x: item.x, y: item.y }, Client.GW.B.colors.white_highlight);
    });
}

