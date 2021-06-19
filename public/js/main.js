/**
 * Socket.io socket
 */
let socket;
/**
 * All peer connections
 */
let peers = {}
let aliasMap ={}

let myAlias;

// redirect if not https
if (location.href.substr(0, 5) !== 'https')
    location.href = 'https' + location.href.substr(4, location.href.length - 4)


//////////// CONFIGURATION //////////////////
/**
 * RTCPeerConnection configuration 
 */
const configuration = {
"iceServers": [   {
            "urls": "stun:stun.l.google.com:19302"
        }]    
}
/**
 * initialize the socket connections
 */
function init() {
    socket = io("/")
    console.log("socket initialized");
    socket.on('yourAlias', alias => {
        console.log(alias)
        $("#myId").text(alias);
        myAlias = alias;
        $("#connection").removeClass("d-none");
    })

    socket.on("connectRtc", peerAlias => {
        console.log(peers.length);
        addPeer(peerAlias, true)
    })

    socket.on('removePeer', alias => {
        removePeer(alias)
        console.log("removePeer", peers.length, alias);
        if(!peers.length){
            $("#connection").removeClass("d-none");
            $("#onConnect").addClass("d-none");
        }
    })

    socket.on('disconnect', () => {
        for (let alias in peers) {
            removePeer(alias)
        }
        console.log("disconnect", peers.length);
        if(!peers.length){
            $("#connection").removeClass("d-none");
            $("#onConnect").addClass("d-none");
        }
    })
    socket.on('signal', data => {
        console.log("signal rcvd", data.alias);
        peers[data.alias].signal(data.signal)
    })
}

/**
 * Remove a peer with given socket_id. 
 * Removes the video element and deletes the connection
 * @param {String} socket_id 
 */
function removePeer(alias) {
    if (peers[alias]) peers[alias].destroy()
    delete peers[alias]
    socket.emit("removePeer", alias)
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id 
 *                 ID of the peer
 * @param {Boolean} am_initiator 
 *                  Set to true if the peer initiates the connection process.
 *                  Set to false if the peer receives the connection. 
 */
function addPeer(alias, am_initiator) {
    console.log("Adding peers ========>", alias, " ===>", am_initiator)
    peers[alias] = new SimplePeer({
        initiator: am_initiator,
        config: configuration
    })

    peers[alias].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            alias: alias,
            myAlias: myAlias
        })
    })

    peers[alias].on('connect', data => {
        peerConnected(alias);
    })

   peers[alias].on('error', err => {
     console.log("peer: " + alias, err);    
   })

   peers[alias].on('data', function (chunk) {
        var textChunk = chunk.toString('utf8');
        peerData(alias, textChunk);
   });

}
