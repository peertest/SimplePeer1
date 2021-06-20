//Configuration
const version = "0.0.1";
const gameConfig = {
    starting_player: 1,
    player_colors: [
        '#FF6542',
        '#392788'
    ]
}
const boardColors = {
    black_highligth: "rgba(41, 204, 174, 0.25)",
    black_square: ["#212518", "#6F7B51"],
    white_highlight: "rgba(41, 204, 174, 0.45)",
    white_square: "#E2E0CB"
}
function peerError(alias, data) {
    /***Error connecting to peer use this to handle connection error**/
    /***If connection was successful before then connection has dropped***/
    /***alias is the peer and data is the error details***/
    console.log('Peer error: ', data)
}
function peerData(alias, rawData) {
    /***Connected Peer sent data use data as required***/
    /***alias is the sender***/
    var data;
    try {
        data = JSON.parse(rawData)
        var opponentPlayerIndex = playerIndex == 1 ? 2 : 1;
        if (data.move) move(opponentPlayerIndex, data.move.from, data.move.to.x, data.move.to.y);

    } catch (e) {
        data = rawData
    }
    console.log(data)
}

function sendData(rawData) {
    console.log('Sending: ', rawData)
    /***Use this section to send data to connected peer***/
    /***alias is the reciever***/
    var data;
    if (typeof data == "object") {
        data = JSON.stringify(rawData)
    } else {
        data = rawData
	}
    if (myPartnerAlias && peers[myPartnerAlias] && data.length) {
        peers[myPartnerAlias].send(data)
    }
    else {
        /****No webrtc***/
    }
    /*console.log("sending", alias, data)
    if(peers[alias] && data.length){

      peers[alias].send(data)
      $("#message").val("");
      $("#messages").prepend($("<p>", { text: "you said: " + data + " to " + alias }))
    }
    else{

    }*/
}
function connected() {

    Client = new GameClient(playerIndex, 'gameWindow');
    Game = new GameProcessor('Player 1', 'Player 2');
    Game.config = gameConfig;
    Client.GW.B.colors = boardColors;
    Game.startGame();
    Client.GW.B.drawBoard();
    refreshPieces();
    Client.GW.onClick((S) => {
        var piece = Game.getPiece(S);
        if (piece && piece.player == Client.playerIndex && playerIndex == Game.turn) {
            drawSelection(S);
            Client.selected = S;
        } else if (Client.selected && Game.isMoveLegal(Client.selected, S.x, S.y)) {
            sendData(JSON.stringify({
                move: {
                    from: Client.selected,
                    to: {
                        x: S.x,
                        y: S.y
                    }
                }
            }));
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
//Display version on bottom left corner
$(function () {
    $('body').append('<footer id="version" style="position: absolute;bottom: 0;color: rgb(27 27 27 / 34%);">' + version + '</footer>')
})