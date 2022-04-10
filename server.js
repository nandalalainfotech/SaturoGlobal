const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const excel = require('exceljs');
var fs = require('fs');
const compression = require('compression');
var multer = require('multer');
var express = require('express');

var app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());
app.use(express.static(__dirname + '/public/dist/saturoglobal'));
var PORT = process.env.PORT || 8000;
const folder = './uploads/';

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var dir = './uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        callback(null, dir);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});

var upload = multer({ storage: storage }).array('file', 12);
app.post('/upload', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).end("Something went wrong:");
        }
        // After uploaded List of xml files are shows
        // fs.readdirSync(folder).forEach(file => {
        //     console.log(file);
        // });
        // After uploaded file are need to be delete
        // let resultHandler = function (err) {
        //     if (err) {
        //         console.log("unlink failed", err);
        //     } else {
        //         console.log("file deleted");
        //     }
        // }
        // fs.unlink("./uploads/"+req.files[0].filename, resultHandler);
        res.status(200).end("Upload completed.");
    });
});

app.get('/', cors(), function (req, res) {
    res.sendFile(path.join(__dirname + '/public/dist/saturoglobal/index.html'));
});

app.post('/api/xml', cors(), async function (req, res) {
    console.log("Xml download");
});


app.listen(PORT, function () {
    console.log('App listening on port ' + PORT);
});



