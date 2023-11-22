const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://127.0.0.1:8080' })); // Replace with your actual origin

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://127.0.0.1:8080', // Replace with your actual origin
    methods: ['GET', 'POST'],
  },
});

const users = {};

// Array to store rooms, each room is an array of socket IDs
const rooms = [];

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('setUsername', (username) => {
      users[username] = socket.id;
      console.log(`${username} is connected with socket ID: ${socket.id}`);
      console.log('users', users);
    })
//   console.log('users', users);

   // Try to find an available room or create a new one
    let room = findAvailableRoom(socket);
    console.log('rooms', rooms);

   // Join the user to the room
    socket.join(room);
    socket.room = room;

  // Notify the user about the room assignment
    socket.emit('roomAssigned', room);

  // Listen for 'message' events from clients
    socket.on('message', (message) => {
        const socketID = socket.id;
        let userName = Object.keys(users).find((key) => users[key] === socketID);
        if (!userName) {
          userName = 'Not_verified_user';
        }
    // Broadcast the message to all users in the same room
        io.to(socket.room).emit('message', { userName, message });
    });
  

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

function findAvailableRoom(socket) {
    // Check if there is a room with available space
    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (room.length < 2) {
        room.push(socket.id);
        return room;
      }
    }
  
    // If no available room is found, create a new one
    const newRoom = [socket.id];
    rooms.push(newRoom);
    return newRoom;
}
  

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
