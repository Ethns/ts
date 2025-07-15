// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.get('/', (req, res) => {
    res.send('俄罗斯方块后端服务器运行中！');
});
// 打印所有请求的 Origin
app.use((req, res, next) => {
    console.log(`[请求] Origin: ${req.headers.origin} | Path: ${req.path}`);
    next();
});
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://ethns.github.io',
        methods: ['GET', 'POST']
    },
});

// 房间机制
io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin;
    console.log(`[Socket连接] Origin: ${origin}, ${socket.id}`);

    socket.on('joinRoom', ({ name, roomId }) => {
    console.log(`[加入房间] 用户 ${name} 请求加入房间 ${roomId}`);

    socket.join(roomId);

    if (!roomUsers[roomId]) {
        roomUsers[roomId] = [];
    }

    roomUsers[roomId].push({ socket, name });

    if (roomUsers[roomId].length === 2) {
        const [player1, player2] = roomUsers[roomId];

        // 通知两人匹配成功
        player1.socket.emit('matchSuccess', { opponent: player2.name });
        player2.socket.emit('matchSuccess', { opponent: player1.name });

        console.log(`[房间 ${roomId}] 对战开始：${player1.name} vs ${player2.name}`);
    } else {
        console.log(`[房间 ${roomId}] 等待第二位玩家...`);
    }
    });

    socket.on('gameUpdate', (data) => {
        socket.to(data.roomId).emit('opponentUpdate', data);
    });

    socket.on('gameOver', (roomId) => {
        socket.to(roomId).emit('opponentGameOver');
    });

    socket.on('disconnect', () => {
        console.log(`[断开] ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`服务器已启动: http://localhost:${PORT}`);
});
