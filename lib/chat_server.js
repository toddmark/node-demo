var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Guest' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {room: room});
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  })

  // old var usersInRoom = io.sockets.clients(room); to new: https://github.com/socketio/socket.io/issues/2428
  var usersInRoom = io.of('/').in(room).clients;
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = socket.id;
      if (userSocketId != socket.id) {
        usersInRoomSummary = ', ';
      }
      usersInRoomSummary += nickNames[userSocketId];
    }
  }
  usersInRoomSummary += '.';
  socket.emit('message', {text: usersInRoomSummary});
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function(name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: "Names cannot begin with 'Guest'.",
      })
    } else {
      console.log(namesUsed, nickNames);
      if (namesUsed.indexOf(name) == -1) {
        var previousName = nickNames[socket.id];
        var previousNameIndex = namesUsed.indexOf(previousName);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now know as ' + name + '.'
        })
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        })
      }
    }
  })
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function(message) {
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ": " + message.text
    })
  })
}

function handleRoomJoining(socket) {
  socket.on('join', function(room) {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  })
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', function() {
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  })
}

exports.listen = function (server) {
  // start socket.io server, mount http server
  io = socketio.listen(server);
  io.set['log level', 1];
  // define logic each user who connect
  io.sockets.on('connection', function (socket) {
    // give user a name
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed)
    // push him to lobby room when user connected
    joinRoom(socket, 'Lobby');

    // handle message, change name, room created or change
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms', function () {
      // old socket.emit('rooms', io.sockets.manager.rooms); to new: https://github.com/socketio/socket.io/issues/2428
      socket.emit('rooms', io.of('/').adapter.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};
