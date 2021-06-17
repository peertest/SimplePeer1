/**
 * Socket.io socket
 */
let socket;
/**
 * The stream object used to send media
 */
let localStream = null;
/**
 * All peer connections
 */
let peers = {}

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
        }         
         /*
         // set your own servers here if needed
         Custom turn/stun servere
         ,{
                    "urls": ["stun:myturnserver.com"],
                    credential: '12345',
                    username: 'abcd'                },
                
                {
                    "urls": ['turn:myturnserver.com'],
                    credential: '12345',
                    username: 'abcd'
                }*/
            ]    
}

init();

/**
 * initialize the socket connections
 */
function init() {
    socket = io("80.7.136.70:3012")
    console.log("socket initialized");
    socket.on('initReceive', socket_id => {
        clog('INIT RECEIVE ' + socket_id)
        addPeer(socket_id, false)
        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        clog('INIT SEND ' + socket_id)
        addPeer(socket_id, true)
    })

    socket.on('removePeer', socket_id => {
        clog('removing peer ' + socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', () => {
        clog('GOT DISCONNECTED')
        for (let socket_id in peers) {
            removePeer(socket_id)
        }
    })

    socket.on('signal', data => {
        peers[data.socket_id].signal(data.signal)
    })
}

/**
 * Remove a peer with given socket_id. 
 * Removes the video element and deletes the connection
 * @param {String} socket_id 
 */
function removePeer(socket_id) {
    if (peers[socket_id]) peers[socket_id].destroy()
    delete peers[socket_id]
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id 
 *                 ID of the peer
 * @param {Boolean} am_initiator 
 *                  Set to true if the peer initiates the connection process.
 *                  Set to false if the peer receives the connection. 
 */
function addPeer(socket_id, am_initiator) {
    clog("Adding peers ========>", socket_id, " ===>", am_initiator)
    peers[socket_id] = new SimplePeer({
        initiator: am_initiator,
        stream: localStream,
        config: configuration
    })

    peers[socket_id].on('signal', data => {
        socket.emit('signal', {
            signal: data,
            socket_id: socket_id
        })
    })

    peers[socket_id].on('stream', stream => {
	console.log("stream");
    })

   peers[socket_id].on('error', stream => {
     console.log(stream);    
   })

}


