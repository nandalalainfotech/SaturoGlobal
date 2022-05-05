const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const excel = require('exceljs');
var fs = require('fs');
const compression = require('compression');
var multer = require('multer');
var express = require('express');
const { create } = require('xmlbuilder');
var app = express();
const child_process = require('child_process');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());

app.use(express.static(path.join(__dirname + '/public/dist/saturoglobal')));
// app.use(express.static(path.join(__dirname + '/ag-grid-community/dist/styles')));

var PORT = process.env.PORT || 8000;
const folder = './uploads/';
var orderNumber = 0;
var fileName = "";
var disease = "";
var uploadfileName = "";
let TargetfileName = '';
let fileArray = [];

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
        uploadfileName = file.originalname;
    }
});


app.get('/uploads/xmlfiles/:originalfilename', function (req, res, next) {
    var filePath = path.join(__dirname + `/uploads/xmlfiles/`) + req.params.originalfilename;
    const filestream = fs.createReadStream(filePath);
    filestream.pipe(res);
});

var upload = multer({ storage: storage }).array('file', 12);
app.post('/upload', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).end("Something went wrong:");
        }

        const reader = require('xlsx')
        const file = reader.readFile('./uploads/' + uploadfileName)
        const sheet1 = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[0]]);
        sheet = JSON.parse(JSON.stringify(sheet1).replace(/\s(?=\w+":)/g, ""));
        sheet.sort(function (a, b) {
            if (a.Ligand_1 < b.Ligand_1) {
                return -1;
            }
            if (a.Ligand_1 > b.Ligand_1) {
                return 1;
            }
            return 0;
        });
        createXmlFolder(req, res, sheet);
    });
});


function createXmlFolder(req, res, sheet) {
    let folderName = "";
    for (let k = 0; k < sheet.length; k++) {
        let data = sheet[k];
        if (data.LINK != "TAN Number") {
            folderName = data.LINK;
            break;
        }
    }
    fs.exists(path.join(__dirname + "/uploads/xmlfiles/", folderName), exists => {
        if (!exists) {
            fs.mkdir(path.join(__dirname + "/uploads/xmlfiles/", folderName), (err) => {
                createLegandXml(req, res, sheet, folderName);
            });
        } else {
            createLegandXml(req, res, sheet, folderName);
        }
    });
}


function createLegandXml(req, res, sheet, folderName) {
    let orderNumber = 0;
    let tempLigant = "";
    let tempLigand_1 = "";
    var doc = null;
    var XMLcontent = null;
    let xlDataLINK = "";
    for (let j = 0; j < sheet.length; j++) {
        let xlData = sheet[j];

        if (xlData.LINK != "TAN Number") {
            try {
                xlDataLINK = xlData.LINK;
                if (j > 0) {
                    let xlData1 = sheet[j - 1];
                    tempLigand_1 = (xlData1.Ligand_1);
                    if (xlData1.Ligand_11 == "NA") {
                        tempLigant = xlData1.Ligand_6;
                    } else {
                        tempLigant = xlData1.Ligand_11;
                    }
                }

                orderNumber = orderNumber + 1;
                if (orderNumber > 1 && (tempLigand_1 == "" || tempLigand_1 != xlData.Ligand_1)) {
                    doc2 = doc.ele('disease');
                    doc2 = doc2.ele('original-disease-name').txt(disease).up().up()
                    doc = doc.doc();

                    let filePath = "uploads/xmlfiles/" + folderName + "/" + fileName + "_" + "_" + orderNumber + ".xml";
                    var xmldoc = doc.toString({ pretty: true });
                    fs.writeFile(filePath, xmldoc, err => {
                        console.log("error in file writting ", err);
                    });
                }
                if (tempLigand_1 != xlData.Ligand_1) {

                    if (tempLigant == "" || tempLigant != xlData.Ligand_11) {
                        if (tempLigand_1 == "" || tempLigand_1 != xlData.Ligand_1) {
                            doc = create("ligand")
                            doc.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
                            doc.att('xsi:noNamespaceSchemaLocation', 'http://ent-ref-dev/xsd/base/bioactivity/5/bioactivity-bmv.xsd');
                            let Ligand1 = xlData.Ligand ? xlData.Ligand.split('">')[0] ? xlData.Ligand.split('">')[0] : "" : "";
                            let LigandText1 = xlData.Ligand ? xlData.Ligand.split('">')[1] ? xlData.Ligand.split('">')[1] : "" : "";
                            doc = doc.ele('ligand-uri', { 'ligand-record-id': Ligand1 }).txt(LigandText1).up();
                            if (xlData.Ligand_1 != undefined && xlData.Ligand_1 != "NA") {
                                doc = doc.ele('ligand-version').txt(xlData.Ligand_1).up();
                            }
                            if (xlData.Ligand_2 != undefined && xlData.Ligand_2 != "NA") {
                                doc = doc.ele('ligand-status').txt(xlData.Ligand_2).up();
                            }

                            if (xlData.Ligand_3 != undefined && xlData.Ligand_3 != "NA") {
                                doc = doc.ele('collection').txt(xlData.Ligand_3).up();
                            }

                            if (xlData.Ligand_5 != undefined && xlData.Ligand_5 != "NA") {
                                doc = doc.ele('ligand-type').txt(xlData.Ligand_5).up();
                            }


                            if (xlData.Ligand_6 != undefined && xlData.Ligand_6 != "NA") {
                                doc = doc.ele('Collection-name').txt(xlData.Ligand_6).up();
                            }

                            if (xlData.Ligand_7 != undefined && xlData.Ligand_7 != "NA") {
                                doc = doc.ele('Collection-id').txt(xlData.Ligand_7).up();
                            }


                            if (xlData.Ligand_11 != undefined && xlData.Ligand_11 != "NA") {
                                doc = doc.ele('locator').txt(xlData.Ligand_11).up();
                            }


                            doc = doc.ele('reference');
                            if (xlData.Reference_1 != undefined && xlData.Reference_1 != "NA") {
                                doc = doc.ele('source-type').txt(xlData.Reference_1).up()
                            }

                            if (xlData.Reference_2 != undefined && xlData.Reference_2 != "NA") {
                                doc = doc.ele('citation').txt(xlData.Reference_2).up().up()
                            }

                            doc = doc.ele('assay')

                            if (xlData.Assay != undefined && xlData.Assay != "NA") {
                                doc = doc.ele('ordinal').txt(xlData.Assay).up()
                            }

                            if (xlData.Assay_1 != undefined && xlData.Assay_1 != "NA") {
                                doc = doc.ele('collection-id').txt(xlData.Assay_1).up()
                            }

                            if (xlData.Assay_2 != undefined && xlData.Assay_2 != "NA") {
                                doc = doc.ele('assay-type').txt(xlData.Assay_2).up()
                            }


                            let Ligand0 = xlData.Ligand ? xlData.Target.split('">')[0] ? xlData.Ligand.split('">')[0] : "" : "";

                            let Ligand3 = Ligand0 ? Ligand0.split('/')[2] ? Ligand0.split('/')[2] : "" : "";

                            let LigandText = xlData.Target ? xlData.Ligand.split('">')[1] ? xlData.Ligand.split('">')[1] : "" : "";

                            let LigandText2 = LigandText ? LigandText.split('ligand/')[1] ? LigandText.split('ligand/')[1] : "" : "";

                            if (xlData.Target != undefined && xlData.Target != "NA") {
                                let target0 = xlData.Target ? xlData.Target.split('">')[0] ? xlData.Target.split('">')[0] : "" : "";
                                let target3 = target0 ? target0.split('/')[2] ? target0.split('/')[2] : "" : "";
                                let targetText = xlData.Target ? xlData.Target.split('">')[1] ? xlData.Target.split('">')[1] : "" : "";
                                let targetText1 = targetText ? targetText.split('target/')[1] ? targetText.split('target/')[1] : "" : "";

                                if (xlData.Reference_2 != undefined && xlData.Reference_2 != "NA") {
                                    doc = doc.ele('target-uri', { 'target-record-id': target0 }).txt(targetText).up()
                                }
                            }


                            fileName = 'biocur' + '.' + Ligand3 + "." + LigandText2;

                            if (xlData.Measurement_1 != undefined && xlData.Measurement_1 != "NA" && xlData.Measurement_1 == "TOX") {
                                doc = doc.ele('Toxicity-type').txt(xlData.Assay_4).up()
                            }

                            doc = doc.ele('measurement')

                            if (xlData.Measurement != undefined && xlData.Measurement != "NA") {
                                doc = doc.ele('data-locator').txt(xlData.Measurement).up()
                            }

                            if (xlData.Measurement_1 != undefined && xlData.Measurement_1 != "NA") {
                                doc = doc.ele('category').txt(xlData.Measurement_1).up()
                            }

                            if (xlData.Measurement_2 != undefined && xlData.Measurement_2 != "NA") {
                                doc = doc.ele('function').txt(xlData.Measurement_2).up()
                            }
                            if (xlData.Measurement_4 != undefined && xlData.Measurement_4 != "NA") {
                                doc = doc.ele('parameter').txt(xlData.Measurement_4).up()
                            }
                            if (xlData.Measurement_5 != undefined && xlData.Measurement_5 != "NA") {
                                doc = doc.ele('Parameter-detail').txt(xlData.Measurement_5).up()
                            }
                            if (xlData.Measurement_6 != undefined && xlData.Measurement_6 != "NA") {
                                doc = doc.ele('original-prefix').txt(xlData.Measurement_6).up()
                            }
                            if (xlData.Measurement_7 != undefined || xlData.Measurement_7 != "NA") {
                                doc = doc.ele('original-value')
                            }

                            if (xlData.Measurement_7 != undefined && xlData.Measurement_7 != "NA") {
                                doc = doc.ele('single-value').txt(xlData.Measurement_7).up()
                            }
                            if (xlData.Measurement_8 != undefined && xlData.Measurement_8 != "NA") {
                                doc = doc.ele('unit').txt(xlData.Measurement_8).up()
                            }
                            if (xlData.Measurement_13 != undefined && xlData.Measurement_13 != "NA") {
                                doc = doc.ele('Non-numeric-value').txt(xlData.Measurement_13).up()
                            }
                            doc = doc.up()
                            if (xlData.Measurement_16 != undefined && xlData.Measurement_16 != "NA") {
                                doc = doc.ele('Remarks').txt(xlData.Measurement_16).up()
                            }
                            doc = doc.up()

                            if (xlData.Biologicalsystem != undefined || xlData.Biologicalsystem != "NA") {
                                doc = doc.ele('biological-system')
                            }

                            if (xlData.Biologicalsystem != undefined && xlData.Biologicalsystem != "NA") {
                                doc = doc.ele('type').txt(xlData.Biologicalsystem).up()
                            }

                            if (xlData.Biologicalsystem_1 != undefined && xlData.Biologicalsystem_1 != "NA") {
                                doc = doc.ele('cell').txt(xlData.Biologicalsystem_1).up()
                            }

                            if (xlData.Biologicalsystem_2 != undefined && xlData.Biologicalsystem_2 != "NA") {
                                doc = doc.ele('Cell-detail').txt(xlData.Biologicalsystem_2).up()
                            }

                            if (xlData.Biologicalsystem_3 != undefined && xlData.Biologicalsystem_3 != "NA") {
                                doc = doc.ele('Organ').txt(xlData.Biologicalsystem_3).up()
                            }


                            if (xlData.Biologicalsystem_4 != undefined && xlData.Biologicalsystem_4 != "NA") {
                                doc = doc.ele('Organ-detail').txt(xlData.Biologicalsystem_4).up()
                            }

                            if (xlData.Biologicalsystem_5 != undefined && xlData.Biologicalsystem_5 != "NA") {
                                doc = doc.ele('Species').txt(xlData.Biologicalsystem_5).up()
                            }

                            if (xlData.Biologicalsystem_6 != undefined && xlData.Biologicalsystem_6 != "NA") {
                                doc = doc.ele('Species-detail').txt(xlData.Biologicalsystem_6).up()
                            }

                            if (xlData.Biologicalsystem_7 != undefined && xlData.Biologicalsystem_7 != "NA") {
                                doc = doc.ele('Gender').txt(xlData.Biologicalsystem_7).up()
                            }

                            if (xlData.Biologicalsystem_8 != undefined && xlData.Biologicalsystem_8 != "NA") {
                                doc = doc.ele('Age-group').txt(xlData.Biologicalsystem_8).up()
                            }

                            if (xlData.Biologicalsystem_9 != undefined && xlData.Biologicalsystem_9 != "NA") {
                                doc = doc.ele('Vocabulary-entry-uri').txt(xlData.Biologicalsystem_9).up()
                            }

                            doc = doc.up()
                            doc = doc.up()
                            disease = xlData.Disease_1;
                        }
                    }
                }
                else {
                    doc1 = doc.ele('assay');

                    if (xlData.Assay != undefined && xlData.Assay != "NA") {
                        doc1 = doc1.ele('ordinal').txt(xlData.Assay).up()
                    }
                    if (xlData.Assay_1 != undefined && xlData.Assay_1 != "NA") {
                        doc1 = doc1.ele('collection-id').txt(xlData.Assay_1).up()
                    }
                    if (xlData.Measurement_1 != undefined && xlData.Measurement_1 != "NA" && xlData.Measurement_1 == "TOX") {
                        doc = doc.ele('Toxicity-type').txt(xlData.Assay_4).up()
                    }
                    if (xlData.Assay_2 != undefined && xlData.Assay_2 != "NA")
                        doc1 = doc1.ele('assay-type').txt(xlData.Assay_2).up()

                    if (xlData.Target != undefined && xlData.Target != "NA") {
                        let target0 = xlData.Target ? xlData.Target.split('">')[0] ? xlData.Target.split('">')[0] : "" : "";
                        let target3 = target0 ? target0.split('/')[2] ? target0.split('/')[2] : "" : "";
                        let targetText = xlData.Target ? xlData.Target.split('">')[1] ? xlData.Target.split('">')[1] : "" : "";
                        let targetText1 = targetText ? targetText.split('target/')[1] ? targetText.split('target/')[1] : "" : "";

                        if (xlData.Reference_2 != undefined && xlData.Reference_2 != "NA") {
                            doc1 = doc1.ele('target-uri', { 'target-record-id': target0 }).txt(targetText).up()
                        }
                    }

                    doc1 = doc1.ele('measurement')

                    if (xlData.Measurement != undefined && xlData.Measurement != "NA") {
                        doc1 = doc1.ele('data-locator').txt(xlData.Measurement).up()
                    }
                    if (xlData.Measurement_1 != undefined && xlData.Measurement_1 != "NA") {
                        doc1 = doc1.ele('category').txt(xlData.Measurement_1).up()
                    }
                    if (xlData.Measurement_2 != undefined && xlData.Measurement_2 != "NA") {
                        doc1 = doc1.ele('function').txt(xlData.Measurement_2).up()
                    }
                    if (xlData.Measurement_4 != undefined && xlData.Measurement_4 != "NA") {
                        doc1 = doc1.ele('parameter').txt(xlData.Measurement_4).up()
                    }
                    if (xlData.Measurement_6 != undefined && xlData.Measurement_6 != "NA") {
                        doc1 = doc1.ele('original-prefix').txt(xlData.Measurement_6).up()
                    }
                    if (xlData.Measurement_7 != "NA" || xlData.Measurement_8 != "NA") {
                        doc1 = doc1.ele('original-value')
                    }

                    if (xlData.Measurement_7 != undefined && xlData.Measurement_7 != "NA") {
                        doc1 = doc1.ele('single-value').txt(xlData.Measurement_7).up()
                    }

                    if (xlData.Measurement_8 != undefined && xlData.Measurement_8 != "NA") {
                        doc1 = doc1.ele('unit').txt(xlData.Measurement_8).up()
                    }
                    if (xlData.Measurement_13 != undefined && xlData.Measurement_13 != "NA") {
                        doc1 = doc1.ele('Non-numeric-value').txt(xlData.Measurement_13).up()
                    }
                    doc1 = doc1.up()
                    if (xlData.Measurement_16 != undefined && xlData.Measurement_16 != "NA") {
                        doc1 = doc1.ele('Remarks').txt(xlData.Measurement_16).up()
                    }
                  //  doc1 = doc1.up()

                    if (xlData.Biologicalsystem != undefined || xlData.Biologicalsystem != "NA") {
                        doc1 = doc1.ele('biological-system')
                    }

                    if (xlData.Biologicalsystem != undefined && xlData.Biologicalsystem != "NA") {
                        doc1 = doc1.ele('type').txt(xlData.Biologicalsystem).up()
                    }

                    if (xlData.Biologicalsystem_1 != undefined && xlData.Biologicalsystem_1 != "NA") {
                        doc1 = doc1.ele('cell').txt(xlData.Biologicalsystem_1).up()
                    }

                    if (xlData.Biologicalsystem_2 != undefined && xlData.Biologicalsystem_2 != "NA") {
                        doc1 = doc1.ele('Cell-detail').txt(xlData.Biologicalsystem_2).up()
                    }

                    if (xlData.Biologicalsystem_3 != undefined && xlData.Biologicalsystem_3 != "NA") {
                        doc1 = doc1.ele('Organ').txt(xlData.Biologicalsystem_3).up()
                    }


                    if (xlData.Biologicalsystem_4 != undefined && xlData.Biologicalsystem_4 != "NA") {
                        doc1 = doc1.ele('Organ-detail').txt(xlData.Biologicalsystem_4).up()
                    }

                    if (xlData.Biologicalsystem_5 != undefined && xlData.Biologicalsystem_5 != "NA") {
                        doc1 = doc1.ele('Species').txt(xlData.Biologicalsystem_5).up()
                    }

                    if (doc1.Biologicalsystem_6 != undefined && xlData.Biologicalsystem_6 != "NA") {
                        doc1 = doc1.ele('Species-detail').txt(xlData.Biologicalsystem_6).up()
                    }

                    if (xlData.Biologicalsystem_7 != undefined && xlData.Biologicalsystem_7 != "NA") {
                        doc1 = doc1.ele('Gender').txt(xlData.Biologicalsystem_7).up()
                    }

                    if (xlData.Biologicalsystem_8 != undefined && xlData.Biologicalsystem_8 != "NA") {
                        doc1 = doc1.ele('Age-group').txt(xlData.Biologicalsystem_8).up()
                    }

                    if (xlData.Biologicalsystem_9 != undefined && xlData.Biologicalsystem_9 != "NA") {
                        doc1 = doc1.ele('Vocabulary-entry-uri').txt(xlData.Biologicalsystem_9).up()
                    }

                    doc1 = doc1.up()
                    doc1 = doc1.up()

                }
            } catch (error) {
                console.log("Exception Occured   ", xlData.Link, "  ", error);
            }
        }
    }

    doc2 = doc.ele('disease');

    doc2 = doc2.ele('original-disease-name').txt(disease).up().up()
    doc = doc.doc();

    let filePath = "uploads/xmlfiles/" + folderName + "/" + fileName + "_" + "_" + orderNumber + ".xml";

    var xmldoc = doc.toString({ pretty: true });
    fs.writeFile(filePath, xmldoc, err => {

        console.log("error in file writting ", err);

    });
    createTargetXml(req, res, sheet, folderName);
}


function createTargetXml(req, res, sheet, folderName) {
    var document = null;
    let orderNumber = 0;


    for (let j = 0; j < sheet.length; j++) {
        orderNumber = orderNumber + 1;
        let data = sheet[j];

        if (data.Target != undefined && data.Target != "NA") {
            if (data.LINK != "TAN Number") {
                try {
                    let targetid = data.Target ? data.Target.split('">')[0] ? data.Target.split('">')[0] : "" : "";
                    let targetTexts = data.Target ? data.Target.split('">')[1] ? data.Target.split('">')[1] : "" : "";
                    document = create("target")
                    document.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
                    document.att('xsi:noNamespaceSchemaLocation', 'http://ent-ref-dev/xsd/base/bioactivity/5/bioactivity-bmv.xsd');
                    document = document.ele('target-uri', { 'target-record-id': targetid }).txt(targetTexts).up()

                    if (data.Target_1 != undefined && data.Target_1 != "NA") {
                        document = document.ele('target-version').txt(data.Target_1).up()
                    }
                    if (data.Target_2 != undefined && data.Target_2 != "NA") {
                        document = document.ele('target-status').txt(data.Target_2).up()
                    }
                    if (data.Target_3 != undefined && data.Target_3 != "NA") {
                        document = document.ele('collection-id').txt(data.Target_3).up()
                    }
                    if (data.Target_4 != undefined && data.Target_3 != "NA") {
                        document = document.ele('original-target-name').txt(data.Target_4).up()
                    }
                    if (data.Target_5 != undefined && data.Target_5 != "NA") {
                        document = document.ele('acronym').txt(data.Target_5).up()
                    }
                    if (data.Target_6 != undefined && data.Target_6 != "NA") {
                        document = document.ele('organism-source').txt(data.Target_6).up()
                    }

                    if (data.Target_7 != undefined && data.Target_7 != "NA") {
                        document = document.ele('Variant').txt(data.Target_7).up()
                    }
                    if (data.Target_8 != undefined && data.Target_8 != "NA") {
                        document = document.ele('Standard-name').txt(data.Target_8).up()
                    }
                    if (data.Target_9 != undefined && data.Target_9 != "NA") {
                        document = document.ele('Common-name').txt(data.Target_9).up()
                    }
                    if (data.Target_10 != undefined && data.Target_10 != "NA") {
                        document = document.ele('Display-name').txt(data.Target_10).up()
                    }
                    if (data.Target_11 != undefined && data.Target_11 != "NA") {
                        document = document.ele('CLIENT-preferred-name').txt(data.Target_11).up()
                    }
                    document = document.doc();

                    let target0 = data.Target ? data.Target.split('">')[0] ? data.Target.split('">')[0] : "" : "";
                    let target3 = target0 ? target0.split('/')[2] ? target0.split('/')[2] : "" : "";
                    let targetText = data.Target ? data.Target.split('">')[1] ? data.Target.split('">')[1] : "" : "";
                    let targetText1 = targetText ? targetText.split('target/')[1] ? targetText.split('target/')[1] : "" : "";

                    TargetfileName = 'biocur' + '.' + target3 + '.' + targetText1;


                    let filePath = "uploads/xmlfiles/" + folderName + "/" + TargetfileName + "_" + orderNumber + ".xml";
                    var xmldoc = document.toString({ pretty: true });
                    fs.writeFile(filePath, xmldoc, err => { if (err) { return console.log(err); } });
                } catch (error) {
                    console.log("Exception Occured  ", data.Link, "  ", error);
                }

            }
        }
    }
    deleteFolderFiles(req, res);
}

function deleteFolderFiles(req, res) {
    const directoryPath = path.join('./uploads/xmlfiles');

    let counter = 0;
    fs.readdirSync(directoryPath).forEach(file => {
        var data = {};
        data.Id = counter,
            data.filename = file,
            data.directoryPath = directoryPath,
            data.filesize = "10kb",
            data.downloadstatus = "downloaded",
            data.date = new Date(),
            fileArray.push(data);
        counter = counter + 1;

    });

    let resultHandler = function (err) {
        if (err) {
            console.log("unlink failed", err);
        } else {
            console.log("file deleted");
        }
    }
    fs.unlink("./uploads/" + req.files[0].filename, resultHandler);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(fileArray);

}


app.listen(PORT, function () {
    console.log('App listening on port ' + PORT);
});



