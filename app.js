var express = require('express');
var app = express();
var serv = require('http').Server(app);
 
app.get('/',function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));
 
serv.listen(2000);
console.log("Server started.");
 
var SOCKET_LIST = {};
var GAMES=[];

var Player = function(data,socketID){
    console.log("creating new player with name= "+ data.username + " and socket id= " +socketID);
	this.socket=socketID;
	this.name=data.username;
	console.log("current playerlist = " +PLAYERS);
    return this;
}

//list of our players
var PLAYERS=[];


Player.onDisconnect = function(socket){
    for (var i=0;i<PLAYERS.length;i++){
		if (PLAYERS[i].name==socket.name){console.log("DELETE NAME PLEASE");}
	}
}

Player.update = function(){
    var pack = [];
    for(var i in PLAYERS){
        var player = PLAYERS[i];
        pack.push({
            x:player.x,
            y:player.y,
            number:player.number
        });    
    }
    return pack;
}
 

 
var DEBUG = true;
 
 
var isUsernameTaken = function(data){
	//console.log("in the isUsernameTaken method!");
	for (var i=0;i<PLAYERS.length;i++){ 
	if (PLAYERS[i].name==data.username){console.log("MAtch!");return true;}
	}
return false;
    }
	
var addUser = function(data,socketID){
        PLAYERS.push(new Player(data,socketID));
	}
	
var games=0;
 
var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;
   
    socket.on('signIn',function(data){
		console.log("setting up");
        var t=isUsernameTaken(data);
            if(!t){
                //Player.onConnect(socket);
				socket.name=data.username;
				addUser(data,socket.id);
				games++;
				console.log("games= " +games);
				if (games>2){
					socket.emit('gameFull',{gameNum:games});
				}
                else{socket.emit('signInResponse',{success:true});
				for(var i in SOCKET_LIST){
					if (socket.id!=i){
					SOCKET_LIST[i].emit('playerEnteredChat',socket.name + " entered the game.");
					}}
				}
            } else {
                socket.emit('signInResponse',{success:false});         
            }
        
    });

   
   
    socket.on('disconnect',function(){
		var playerName = (""+ socket.name);
		games--;
        delete SOCKET_LIST[socket.id];
		delete SOCKET_LIST[socket.name];
        //player.onDisconnect(socket);
		
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('playerLeftChat',playerName + " left the game.");
        }
    });
    socket.on('sendMsgToServer',function(data){
        var playerName = ("" + socket.name);
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
        }
    });
   
    socket.on('evalServer',function(data){
        if(!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer',res);     
    });
	
	socket.on('buttonClick',function(data){
		 console.log("got to button click!"+data);
        var playerName=(""+ socket.name);
		for (var i = 0; i<PLAYERS.length;i++){
			if (PLAYERS[i].name!=playerName){console.log("found different player from" + playerName+" - "+PLAYERS[i].name+PLAYERS[i].socket + "his socket is "+SOCKET_LIST[PLAYERS[i].socket]);
			SOCKET_LIST[PLAYERS[i].socket].emit('changeButtonsOpponent',data);  
			}
		}
	
    });

  
   
});
 
setInterval(function(){
    var pack = {
        
    }
   
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        //socket.emit('newPositions',pack);
    }
},1000/25);