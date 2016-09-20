var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}


function hostCreateNewGame() {
    var thisGameId = ( Math.random() * 100000 ) | 0;
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});
    this.join(thisGameId.toString());
};

function hostPrepareGame(gameId) {
    var sock = this;
    var data = { mySocketId : sock.id,gameId : gameId };
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

function hostStartGame(gameId) {
    sendWord(0,gameId);
};

function hostNextRound(data) {
    if(data.round < wordPool.length ){
        sendWord(data.round, data.gameId);
    } else {
        io.sockets.in(data.gameId).emit('gameOver',data);
    }
}

function playerJoinGame(data) {
    var sock = this;
    var room = gameSocket.manager.rooms["/" + data.gameId];
    if(room != undefined ){
        data.mySocketId = sock.id;
        sock.join(data.gameId);
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}

function playerAnswer(data) {
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

function playerRestart(data) {
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

function sendWord(wordPoolIndex, gameId) {
    var data = getWordData(wordPoolIndex);
    io.sockets.in(data.gameId).emit('newWordData', data);
}

function getWordData(i){
    var words = wordPool[i].words;
    var decoys = wordPool[i].decoys;
    var wordData = { round: i,word : words[0],answer : words[1], list : decoys  };
    return wordData;
}

var wordPool = [
    {
        "words"  : [ "Who is the Captain of the Indian Test Cricket team","kohli"],
        "decoys" : [ "dhoni","kohli","kumble","dravid" ]
    },

    {
        "words"  : [ "Messi belongs to which football club","barcelona"],
        "decoys" : [ "realmadrid","chelsea","barcelona","liverpool" ]
    },

    {
        "words"  : [ "How many medals did india won in rio","2"],
        "decoys" : [ "3","2","1","4" ]
    },

    {
        "words"  : [ "Who is india prime minister","modi"],
        "decoys" : [ "modi","kodi","jedi","podi" ]
    }
]