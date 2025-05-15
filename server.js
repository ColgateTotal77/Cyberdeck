const express = require('express');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const RegisterController = require('./RegisterController.js');
const AuthController = require('./AuthController.js');
const MainPageController = require('./MainPageController.js');
const RestoreController = require('./RestoreController.js');

const MySQLStore = require('express-mysql-session')(session);
const config = require('./config.json');

const app = express();
const sessionStore = new MySQLStore(config);

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('test', (data) => {
        console.log(`${socket.id} - ${data}`);
    });

});

app.use(session({
    secret: '7167595f60bb18670c9dcce58a599ac4e94d4cc4aa958b776ff654a6ed7a0c1a4a206a5590db243b8212ad3ed38ff5c1ca2b27e42ded6fafbbc315978225825e',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000 * 12
    }
}));

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

app.get('/registerForm', (req, res) => RegisterController.registerForm(req, res));
app.post('/register', (req, res) => RegisterController.register(req, res));
app.get('/loginForm', (req, res) => AuthController.loginForm(req, res));
app.post('/login', (req, res) => AuthController.login(req, res));
app.post('/toRegisterForm', (req, res) => AuthController.toRegisterForm(req, res));
app.post('/userData', (req, res) => MainPageController.userData(req, res));
app.get('/mainPage', (req, res) => MainPageController.mainPage(req, res));
app.post('/logOut', (req, res) => MainPageController.logOut(req, res));
app.get('/restorePasswordForm', (req, res) => RestoreController.restorePasswordForm(req, res));
app.post('/remindPassword', (req, res) => RestoreController.remindPassword(req, res));

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/views/404.html');
});

const port = 3001;

server.listen(port, () => {
    console.log(`Server running at http://localhost:3001/loginForm`);
});