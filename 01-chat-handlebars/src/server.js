// Server.js
import express from 'express';
import { __dirname } from './utils.js';
import { errorHandler } from './middlewares/errorHandler.js';
import expressHandlebars from 'express-handlebars'; // Importa express-handlebars
import { Server } from 'socket.io';
import viewsRouter from './routes/views.router.js';
import MessageManager from './managers/messages.manager.js';

const messageManager = new MessageManager(`${__dirname}/db/messages.json`);
const app = express();
const handlebars = expressHandlebars(); // Inicializa express-handlebars

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', handlebars.engine); // Usa handlebars.engine en lugar de handlebars()
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');

app.use('/chat', viewsRouter);

app.use(errorHandler);

const httpServer = app.listen(8080, () => {
    console.log('🚀 Server listening on port 8080');
});

const socketServer = new Server(httpServer, { cors: { origin: 'http://localhost:5173' } });

socketServer.on('connection', async (socket) => {
    console.log('🟢 ¡New connection!', socket.id);

    socketServer.emit('messages', await messageManager.getAll());

    socket.on('disconnect', () => {
        console.log('🔴 User disconnect', socket.id);
    });

    socket.on('newUser', (user) => {
        console.log(`> ${user} ha iniciado sesión`);
        socket.broadcast.emit('newUser', user);
    });

    socket.on('chat:message', async (msg) => {
        await messageManager.createMsg(msg);
        socketServer.emit('messages', await messageManager.getAll());
    });

    socket.on('chat:typing', (username) => {
        socket.broadcast.emit('chat:typing', username);
    });
});
