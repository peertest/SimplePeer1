peers = {}
aliasmap = {}


module.exports = (io) => {
    io.on('connect', (socket) => {
        console.log('a client is connected ', socket.id)

        let alias = makeid(6);
        peers[alias] = socket;
        socket.emit("yourAlias", alias);
        aliasmap[socket.id] =  alias;
        /**
         * relay a peerconnection signal to a specific socket
         */
         socket.on('signal', data => {
            console.log('sending signal from ' + socket.id)
            let myAlias = aliasmap[socket.id]
            if(!peers[data.alias])return
            signal = {
                signal: data.signal,
                alias: myAlias
            }
            peers[data.alias].emit('signal', signal)
        })

        socket.on('connectRtc', data => {
            try{
                console.log(data.connectTo, data.myAlias);
                peers[data.connectTo].emit("connectRtc", data.myAlias);
            }
            catch{
                console.log();
            }
            
        })

        /**
         * remove the disconnected peer connection from all other connected clients
         */
         socket.on('disconnect', () => {
            let _alias = aliasmap[socket.id];
            console.log('socket disconnected ' + socket.id + " alias: " + _alias)
            socket.broadcast.emit('removePeer', _alias)
            delete peers[_alias];
            delete aliasmap[socket.id];
        })

        /*socket.on('removePeer', () =>{
            let _alias = aliasmap[socket.id];
            socket.broadcast.emit('removePeer', _alias)
        })*/
    })
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *  charactersLength));
    }
    if(peers[result]){
        result = makeid(6);
    }
    return result;
}
