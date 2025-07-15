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

const waitingPlayers = []; // 存储等待匹配的 { socket, name }
// 房间机制
io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin;
    console.log(`[Socket连接] Origin: ${origin}, ${socket.id}`);

    socket.on('joinQueue', ({ name }) => {
    console.log(`[匹配] ${name} 请求加入队列`);

    if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.shift(); // 拿出排队最久的
        const roomId = `room-${opponent.socket.id}-${socket.id}`;

        // 让双方加入同一个房间
        opponent.socket.join(roomId);
        socket.join(roomId);

        console.log(`[房间] 配对成功：${opponent.name} vs ${name} → ${roomId}`);

        // 通知双方
        opponent.socket.emit('matchFound', {
        roomId,
        opponent: name
        });

        socket.emit('matchFound', {
        roomId,
        opponent: opponent.name
        });

    } else {
        // 没有其他玩家，当前玩家加入等待队列
        waitingPlayers.push({ socket, name });
        console.log(`[匹配] ${name} 正在等待配对...`);
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
