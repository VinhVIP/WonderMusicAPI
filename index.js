const express = require('express');
const app = express();
const dotenv = require('dotenv');
const db = require('./src/database');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./src/swagger.json');
const port = process.env.PORT || 8000;
const apiUrl = '/api/v0';
const fileUpload = require('express-fileupload');


dotenv.config();
db.connect()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: false, limit: '30mb' }));

app.use(fileUpload({
    limits: {
        fileSize: 30 * 1024 * 1024
    },
    abortOnLimit: true
}));


app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === "OPTIONS") {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        message: error
    })
});

// Type
app.use(`${apiUrl}/type`, require('./src/api/v0/router/type'));
// Account
app.use(`${apiUrl}/account`, require('./src/api/v0/router/account'));
// Song
app.use(`${apiUrl}/song`, require('./src/api/v0/router/song'));
//Album
app.use(`${apiUrl}/album`, require('./src/api/v0/router/album'));
//Love
app.use(`${apiUrl}/love`, require('./src/api/v0/router/love'));
//Follow
app.use(`${apiUrl}/follow`, require('./src/api/v0/router/follow'));
//Listen
app.use(`${apiUrl}/listen`, require('./src/api/v0/router/listen'));

//playlist
app.use(`${apiUrl}/playlist`, require('./src/api/v0/router/playList'))
app.use(`${apiUrl}/playlist_song`, require('./src/api/v0/router/playlistSong'))
app.use(`${apiUrl}/song`, require('./src/api/v0/router/comment'))
app.use(`${apiUrl}/notification`, require('./src/api/v0/router/notification'))
app.use(`${apiUrl}/account-device`, require('./src/api/v0/router/account_device'))
app.use(`${apiUrl}/search`, require('./src/api/v0/router/search'))

app.listen(port, () => {
    console.log(`Start website http://localhost:${port}`)
});