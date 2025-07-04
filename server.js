const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');

const RegisterController = require('./controllers/RegisterController.js');
const AuthController = require('./controllers/AuthController.js');
const MainPageController = require('./controllers/MainPageController.js');
const RestoreController = require('./controllers/RestoreController.js');
const BattleController = require('./controllers/BattleController.js');
const APIController = require('./controllers/APIController.js');

const Socket = require('./Socket.js');

const MySQLStore = require('express-mysql-session')(session);
const config = require('./config.json');

const app = express();
const sessionStore = new MySQLStore(config);

const sessionMiddleware = session({
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
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/avatars');
  },
  filename: (req, file, cb) => {
    const username = req.session?.user?.login || 'anonymous';
    const ext = path.extname(file.originalname);
    cb(null, username + ext);
  },
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });

(async () => {
    await Socket.loadCards();
    const server = Socket.inicialization(app, sessionMiddleware);
    Socket.process();

    const apiController = await new APIController().init();

    app.use(sessionMiddleware);
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(__dirname + '/public'));

    app.get('/', (req, res) => MainPageController.firstPage(req, res));
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
    app.get('/battle/:roomId', (req, res) => BattleController.BattlePage(req, res));
    app.get('/api/getBattleInfo', (req, res) => apiController.getBattleInfo(req, res));
    app.get('/api/getAllCards', (req, res) => apiController.getAllCards(req, res));
    app.post('/uploadAvatar', upload.single('avatar'), async (req, res) => { await MainPageController.uploadAvatar(req, res); });
    app.post('/api/getAvatarPath', (req, res) => apiController.getAvatarPath(req, res));
    app.get('/api/getAllMatchHistory', (req, res) => apiController.getAllMatchHistory(req, res));

    app.use((req, res) => {
        res.status(404).sendFile(__dirname + '/views/404.html');
    });

    const port = 3001;
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
})();
