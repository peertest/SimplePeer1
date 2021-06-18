
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

        let myId;

        let myAlias;

        // redirect if not https
        if (location.href.substr(0, 5) !== 'https')
            location.href = 'https' + location.href.substr(4, location.href.length - 4)


        //////////// CONFIGURATION //////////////////

        /**
         * RTCPeerConnection configuration
         */
        const configuration = {
            "iceServers": [{
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



        /**
         * initialize the socket connections
         */
        function init() {
            socket = io("/")
            socket.on("connect", () => {
                myId = socket.id;
                
            });

            socket.on('initReceive', socket_id => {
                console.log(socket_id, "init rcvd");
                //addPeer(socket_id, false);
                socket.emit('initSend', socket_id)
            })

            socket.on('initSend', socket_id => {
                console.log(socket_id, "init sent");
                //addPeer(socket_id, true)
            })

            socket.on('removePeer', socket_id => {
                console.log(socket_id, "peer removed");
                removePeer(socket_id)
            })
                
           socket.on('yourAlias', alias => {
                myAlias = alias;
                console.log("yourAlias", alias)
                $("#myId").text(myId);
            })


            /*socket.on('signal', data => {
                console.log(data, "got signal webrtc successful")
                peers[data.socket_id].signal(data.signal)
            })*/
        }

        /**
         * Remove a peer with given socket_id.
         * Removes the video element and deletes the connection
         * @@param {String} socket_id
         */
        function removePeer(socket_id) {
            if (peers[socket_id]) peers[socket_id].destroy()
            delete peers[socket_id]
            $("." + socket_id).remove();
        }

        /**
         * Creates a new peer connection and sets the event listeners
         * @@param {String} socket_id
         *                 ID of the peer
         * @@param {Boolean} am_initiator
         *                  Set to true if the peer initiates the connection process.
         *                  Set to false if the peer receives the connection.
         */
        function addPeer(socket_id, am_initiator) {
            peers[socket_id] = new SimplePeer({
                initiator: am_initiator,
                config: configuration
            })
            
            peers[socket_id].on('signal', data => {
                socket.emit('signal', {
                    signal: data,
                    socket_id: socket_id
                })
                peerConnected(socket_id)
            })

            peers[socket_id].on('error', err => {
                peerError(socket_id, err)
            })
                
            peers[socket_id].on('data', function (chunk) {
                var textChunk = chunk.toString('utf8');
                peerData(soket_id, textChunk)                  
            });
        }
