// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.get('/', (req, res) => {
  res.send('俄罗斯方块后端服务器运行中！');
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
});

// 房间机制
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id}`);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`[房间] ${socket.id} 加入 ${roomId}`);
    socket.to(roomId).emit('opponentJoined');
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
