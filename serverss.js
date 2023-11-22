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

const users = [];

// Array to store rooms, each room is an array of socket IDs
const rooms = [];

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('setUsername', (username) => {
        users.push({ id: username, socket: socket });
        console.log(`${username} is connected with socket ID: ${socket.id}`);
        console.log('users', users);
    });

    socket.on('AddFriends', (addfriends) => {
        try {
            const room = FriendsRoom(socket, addfriends);
            console.log('Room created:', room);
        } catch (error) {
            console.error(error.message);
            socket.emit('error', { message: error.message });
        }
        console.log('rooms', rooms);
    });

    // Listen for 'message' events from clients
    socket.on('message', (message, addfriends) => {
        const userID = socket.id;
        let userObject = users.find((user) => user.socket.id === userID);
        let userName;
        if (!userObject) {
            userName = userID;
        } else {
            userName = userObject.id
        }

        const friendsUser = users.find((user) => user.id === addfriends);
        if (!friendsUser) {
            throw new Error('Friend not found');
        }
        const roomName = `room_${userName}_${addfriends}`;
        // Broadcast the message to all users in the same room if the room is defined
        const room = rooms.find((r)=> r.name === roomName);

        if (room) {
            io.to(room).emit('message', { userName, message });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Remove the disconnected user from the users array
        const index = users.findIndex((user) => user.socket.id === socket.id);
        if (index !== -1) {
            users.splice(index, 1);
            console.log('users', users);
        }
    });
});

function FriendsRoom(socket, addfriends) {
    const userID = socket.id;
    let userObject = users.find((user) => user.socket.id === userID);
    let userName;
    if (!userObject) {
        userName = userID;
    } else {
        userName = userObject.id
    }

    const friendsUser = users.find((user) => user.id === addfriends);
    if (!friendsUser) {
        throw new Error('Friend not found');
    }
    const roomName = `room_${userName}_${addfriends}`;

    let room = rooms.find((r) => r.name === roomName);

    if (!room) {
        // If the room doesn't exist, create a new one
        room = { name: roomName, users: [userID, friendsUser.socket.id] };
        rooms.push(room);

        // Join the individual sockets to the room
        socket.join(room.name);
        friendsUser.socket.join(room.name);

        // Broadcast a message to the room
        io.to(room.name).emit('message', {userName:'all users messages:', message:'Welcome to the room!'});
    }

    return room;
}

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
