const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

if (process.env.LOGGING === 'true') {
    const accessLog = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
    app.use(morgan('combined', { stream: accessLog }));
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'tmp');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

async function moveWrapper(src, dest) {
    try {
        await fs.move(src, dest);
    } catch (err) {
        console.error(err);
        throw err;
    }
}

app.post('/upload', upload.array('fileUploadField'), (req, res) => {
    try {
        if (!req.files) { // redundant since the file selector in index.html specifies that file input is required to submit the form
            res.send('<p>Error: No files uploaded.');
            console.log(req.body.media_type_selector);
        } else {
            let finalDirectory = `${process.env.PLEX_DIRECTORY}/${req.body.media_type_selector}/${req.body.media_name}`;

            moveWrapper('tmp', finalDirectory); // move from local tmp directory to the specified path in .env

            res.redirect('/'); // send back to main page
        }
    } catch (err) {
        throw err
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.listen(process.env.PORT, (error) => {
    if (error) {
        throw error
    }
    console.log(`Server created successfully and is listening on PORT: ${process.env.PORT}`);
});

app.use((err, res) => {
    console.error(err.stack);
    res.status(500).send(err.message);
});