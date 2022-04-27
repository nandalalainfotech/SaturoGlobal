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

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());
app.use(express.static(__dirname + '/public/dist/saturoglobal'));
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
    console.log(req);
    var filePath = path.join(`./uploads/xmlfiles/`) + req.params.originalfilename;
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
            if (a.Ligand_11 < b.Ligand_11) {
                return -1;
            }
            if (a.Ligand_11 > b.Ligand_11) {
                return 1;
            }
            return 0;
        });


        // let tempLigant = "";
        // for (let j = 1; j < sheets.length; j++) {

        //     if (tempLigant == "") {
        //         tempLigant = sheet[j].Ligand_11;
        //         createLegandXml(sheet[j]);
        //         // console.log("testing1-------->>>>",tempLigant);
        //     } else if (tempLigant == sheet[j].Ligand_11) {
        //         // createLegandXml(sheet[j]);
        //         // console.log("testing2-------->>>>",tempLigant);

        //     } else if (tempLigant != sheet[j].Ligand_11) {
        //         tempLigant = sheet[j].Ligand_11;
        //         createLegandXml(sheet[j]);
        //         // console.log("testing3-------->>>>",tempLigant);
        //     }
        //console.log("sheet1==========>", sheet);
        createLegandXml(sheet);
        createTargetXml(sheet);


        const directoryPath = path.join('./uploads/xmlfiles');
        // fs.readdir(directoryPath, function (err, files) {
        //     if (err) {
        //         return console.log('Unable to scan directory: ' + err);
        //     }
        //     files.forEach(function (file) {
        //         fileArray.push(file);
        //     });

        // });
let counter = 0;
        fs.readdirSync(directoryPath).forEach(file => {
            console.log("file---------->>>", file);
            var data = {};
            // let data: any,
            data.Id = counter,
            data.filename= file,
            data.directoryPath= directoryPath,
            data.filesize="10kb",
            data.downloadstatus= "downloaded",
            data.date=new Date()
            fileArray.push(data);
            counter = counter +1;

        });
        console.log("    =========================  " + fileArray);
        // After uploaded List of xml files are shows
        // fs.readdirSync(folder).forEach(file => {
        //     console.log("file---------->>>", file);
        // });
        // After uploaded file are need to be delete
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


    });


});



function createLegandXml(sheet) {
    let orderNumber = 0;
    let tempLigant = "";
    let tempLigand_1 = "";
    var doc = null;
    var XMLcontent = null;
    for (let j = 1; j < sheet.length; j++) {

        let xlData = sheet[j];
        // console.log("xlData=========>", xlData);
        if (j > 1) {
            let xlData1 = sheet[j - 1];
            tempLigand_1 = (xlData1.Ligand_1);
            tempLigant = xlData1.Ligand_11;
        }

        if (orderNumber > 1 && (tempLigand_1 == "" || tempLigand_1 != xlData.Ligand_1)) {
            //            doc = doc.ele('ligand', { 'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance' }, 
            //{ 'xsi:noNamespaceSchemaLocation': 'http://ent-ref-dev/xsd/base/bioactivity/5/bioactivity-bmv.xsd' }).txt(xlData.Ligand).up();
            doc2 = doc.ele('disease');

            doc2 = doc2.ele('original-disease-name').txt(disease).up().up()

            doc = doc.doc();
            let filePath = "uploads/xmlfiles/" + fileName + ".xml";
            var xmldoc = doc.toString({ pretty: true });
            fs.writeFile(filePath, xmldoc, err => { });

        }

        orderNumber = orderNumber + 1;

        if (tempLigand_1 != xlData.Ligand_1) {

            // console.log(" tempLigant    =======", tempLigant, "  ROW VALUE", xlData.Ligand_11);
            if (tempLigant == "" || tempLigant != xlData.Ligand_11) {

                if (tempLigand_1 == "" || tempLigand_1 != xlData.Ligand_1) {
                    doc = create("ligand")

                    doc.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
                    doc.att('xsi:noNamespaceSchemaLocation', 'http://ent-ref-dev/xsd/base/bioactivity/5/bioactivity-bmv.xsd');
                    let Ligand1 = xlData.Ligand ? xlData.Ligand.split('">')[0] : "";
                    let LigandText1 = xlData.Ligand ? xlData.Ligand.split('">')[1] : "";
                    doc = doc.ele('ligand-uri', { 'ligand-record-id': Ligand1 }).txt(LigandText1).up();




                    if (xlData.Ligand_1 != "" && xlData.Ligand_1 != "NA")
                        doc = doc.ele('ligand-version').txt(xlData.Ligand_1).up();

                    if (xlData.Ligand_2 != "" && xlData.Ligand_2 != "NA")
                        doc = doc.ele('ligand-status').txt(xlData.Ligand_2).up();

                    if (xlData.Ligand_3 != "" && xlData.Ligand_3 != "NA")
                        doc = doc.ele('collection').txt(xlData.Ligand_3).up();


                    if (xlData.Ligand_4 != "" && xlData.Ligand_4 != "NA")


                        if (xlData.Ligand_5 != "" && xlData.Ligand_5 != "NA")
                            doc = doc.ele('ligand-type').txt(xlData.Ligand_5).up();


                    if (xlData.Ligand_7 != "" && xlData.Ligand_7 != "NA")
                        doc = doc.ele('locator-id').txt(xlData.Ligand_7).up();

                    if (xlData.Ligand_11 != "" && xlData.Ligand_11 != "NA")
                        doc = doc.ele('locator').txt(xlData.Ligand_11).up();

                    doc = doc.ele('reference');
                    if (xlData.Reference_1 != "" && xlData.Reference_1 != "NA")
                        doc = doc.ele('source-type').txt(xlData.Reference_1).up()
                    if (xlData.Reference_2 != "" && xlData.Reference_2 != "NA")
                        doc = doc.ele('citation').txt(xlData.Reference_2).up()
                            .up()
                    doc = doc.ele('assay')


                    if (xlData.Assay != "" && xlData.Assay != "NA")
                        doc = doc.ele('ordinal').txt(xlData.Assay).up()

                    if (xlData.Assay_1 != "" && xlData.Assay_1 != "NA")
                        doc = doc.ele('collection-id').txt(xlData.Assay_1).up()

                    if (xlData.Assay_2 != "" && xlData.Assay_2 != "NA")
                        doc = doc.ele('assay-type').txt(xlData.Assay_2).up()

                    // console.log("  TOX    " + xlData.Assay_4);

                    // .ele('procedure').txt('Hexokinase-II enzyme activity assay').up()

                    // .ele('procedure').txt('Hexokinase-II enzyme activity assay').up()
                    let target0 = xlData.Ligand ? xlData.Ligand.split('">')[0] : "";
                    let target3 = target0 ? target0.split('/')[2] : "";
                    let targetText = xlData.Ligand ? xlData.Ligand.split('">')[1] : "";
                    let targetText1 = targetText ? targetText.split('ligand/')[1] : "";

                    // console.log("TORGET CONTENT " + targetText);
                    // console.log("TORGET CONTENT1 " + targetText1);
                    // console.log("targetTexttargetTexttargetTexttargetText", target3 + "." + targetText1);
                    fileName = 'biocur' + '.' + target3 + "." + targetText1;


                    //                   console.log(" xlData.Measurement_1 "   ,  xlData.Measurement_1 );
                    if (xlData.Measurement_1 != "" && xlData.Measurement_1 != "NA" && xlData.Measurement_1 == "TOX")
                        doc = doc.ele('Toxicity-type').txt(xlData.Assay_4).up()

                    if (xlData.Reference_2 != "" && xlData.Reference_2 != "NA")
                        doc = doc.ele('target-uri', { 'target-record-id': target0 }).txt(targetText).up()

                    doc = doc.ele('measurement')

                    if (xlData.Measurement != "" && xlData.Measurement != "NA")
                        doc = doc.ele('data-locator').txt(xlData.Measurement).up()

                    if (xlData.Measurement_1 != "" && xlData.Measurement_1 != "NA")
                        doc = doc.ele('category').txt(xlData.Measurement_1).up()

                    if (xlData.Measurement_2 != "" && xlData.Measurement_2 != "NA")
                        doc = doc.ele('function').txt(xlData.Measurement_2).up()

                    if (xlData.Measurement_4 != "" && xlData.Measurement_4 != "NA")
                        doc = doc.ele('parameter').txt(xlData.Measurement_4).up()

                    if (xlData.Measurement_6 != "" && xlData.Measurement_6 != "NA")
                        doc = doc.ele('original-prefix').txt(xlData.Measurement_6).up()

                    if (xlData.Measurement_7 != "NA" || xlData.Measurement_8 != "NA") {
                        doc = doc.ele('original-value')

                    }

                    if (xlData.Measurement_7 != "" && xlData.Measurement_7 != "NA")
                        doc = doc.ele('single-value').txt(xlData.Measurement_7).up()

                    if (xlData.Measurement_8 != "" && xlData.Measurement_8 != "NA")
                        doc = doc.ele('unit').txt(xlData.Measurement_8).up()
                            .up()
                            .up()

                    if (xlData.Biologicalsystem != "NA" || xlData.Biologicalsystem != "NA") {
                        doc = doc.ele('biological-system')

                    }

                    if (xlData.Biologicalsystem != "" && xlData.Biologicalsystem != "NA")
                        doc = doc.ele('type').txt(xlData.Biologicalsystem).up()

                    if (xlData.Biologicalsystem_1 != "" && xlData.Biologicalsystem_1 != "NA")
                        doc = doc.ele('cell').txt(xlData.Biologicalsystem_1).up()
                            .up()
                            .up()


                    disease = xlData.Disease_1;
                    // console.log(" tempLigand_1 -----------ifffff->>>>>", tempLigand_1)
                }
            }
        } else {
            doc1 = doc.ele('assay');

            if (xlData.Assay != "" && xlData.Assay != "NA")
                doc1 = doc1.ele('ordinal').txt(xlData.Assay).up()

            if (xlData.Assay_1 != "" && xlData.Assay_1 != "NA")
                doc1 = doc1.ele('collection-id').txt(xlData.Assay_1).up()

            //   console.log(" xlData.Measurement_1 "   ,  xlData.Measurement_1 );
            if (xlData.Measurement_1 != "" && xlData.Measurement_1 != "NA" && xlData.Measurement_1 == "TOX")
                doc = doc.ele('Toxicity-type').txt(xlData.Assay_4).up()

            if (xlData.Assay_2 != "" && xlData.Assay_2 != "NA")
                doc1 = doc1.ele('assay-type').txt(xlData.Assay_2).up()

            if (xlData.Reference_2 != "" && xlData.Reference_2 != "NA")
                doc1 = doc1.ele('target-uri', { 'target-record-id': 'bioactivity-target/*partner*/46549519P/1/1' }).txt(xlData.Target).up()

            doc1 = doc1.ele('measurement')

            if (xlData.Measurement != "" && xlData.Measurement != "NA")
                doc1 = doc1.ele('data-locator').txt(xlData.Measurement).up()

            if (xlData.Measurement_1 != "" && xlData.Measurement_1 != "NA")
                doc1 = doc1.ele('category').txt(xlData.Measurement_1).up()

            if (xlData.Measurement_2 != "" && xlData.Measurement_2 != "NA")
                doc1 = doc1.ele('function').txt(xlData.Measurement_2).up()

            if (xlData.Measurement_4 != "" && xlData.Measurement_4 != "NA")
                doc1 = doc1.ele('parameter').txt(xlData.Measurement_4).up()

            if (xlData.Measurement_6 != "" && xlData.Measurement_6 != "NA")
                doc1 = doc1.ele('original-prefix').txt(xlData.Measurement_6).up()

            if (xlData.Measurement_7 != "NA" || xlData.Measurement_8 != "NA") {
                doc1 = doc1.ele('original-value')
            }

            if (xlData.Measurement_7 != "" && xlData.Measurement_7 != "NA")
                doc1 = doc1.ele('single-value').txt(xlData.Measurement_7).up()

            if (xlData.Measurement_8 != "" && xlData.Measurement_8 != "NA")
                doc1 = doc1.ele('unit').txt(xlData.Measurement_8).up()
                    .up()
                    .up()

        }


    }

    doc2 = doc.ele('disease');

    doc2 = doc2.ele('original-disease-name').txt(disease).up()
        .up()

    doc.att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    doc = doc.doc();
    let filePath = "uploads/xmlfiles/" + fileName + ".xml";
    var xmldoc = doc.toString({ pretty: true });
    fs.writeFile(filePath, xmldoc, err => { });

    // var fileContent[];
    // fs.readFile(filePath, 'utf8' , (err, data) => {
    //     fileContent[0]=fileName;
    //     fileContent[1]="DATE";
    //     fileContent[2]="SIZE";
    //     fileContent[3]=data;
    //     if (err) {
    //       console.error(err)
    //       return
    //     }
    //    // console.log(data)
    //   })
    //   uploadedArray[0] = fileContent;

}


function createTargetXml(sheet) {
    var document = null;
    let orderNumber = 0;

    for (let j = 1; j < sheet.length; j++) {
        orderNumber = orderNumber + 1;
        let data = sheet[j];
        // console.log("xml ", data)
        let targetid = data.Target ? data.Target.split('">')[0] : "";
        // console.log(targetid);
        let targetTexts = data.Target ? data.Target.split('">')[1] : "";
        // console.log(targetTexts);
        document = create("target")

        document = document.ele('target-uri', { 'target-record-id': targetid }).txt(targetTexts).up()

        if (data.Target_1 != "" && data.Target_1 != "NA")
            document = document.ele('target-version').txt(data.Target_1).up()

        if (data.Target_2 != "" && data.Target_2 != "NA")
            document = document.ele('target-status').txt(data.Target_2).up()

        if (data.Target_3 != "" && data.Target_3 != "NA")
            document = document.ele('collection-id').txt(data.Target_3).up()

        if (data.Target_4 != "" && data.Target_4 != "NA")
            document = document.ele('original-target-name').txt(data.Target_4).up()

        if (data.Target_5 != "" && data.Target_5 != "NA")
            document = document.ele('acronym').txt(data.Target_5).up()

        if (data.Target_6 != "" && data.Target_6 != "NA")
            document = document.ele('organism-source').txt(data.Target_6).up()

        if (data.Target_7 != "" && data.Target_7 != "NA")
            document = document.ele('Variant').txt(data.Target_7).up()

        if (data.Target_8 != "" && data.Target_8 != "NA")
            document = document.ele('Standard-name').txt(data.Target_8).up()

        if (data.Target_9 != "" && data.Target_9 != "NA")
            document = document.ele('Common-name').txt(data.Target_9).up()

        if (data.Target_10 != "" && data.Target_10 != "NA")
            document = document.ele('Display-name').txt(data.Target_10).up()

        if (data.Target_11 != "" && data.Target_11 != "NA")
            document = document.ele('CLIENT-preferred-name').txt(data.Target_11).up()

        document = document.doc();


        let target0 = data.Target ? data.Target.split('">')[0] : "";
        let target3 = target0 ? target0.split('/')[2] : "";
        let targetText = data.Target ? data.Target.split('">')[1] : "";
        let targetText1 = targetText ? targetText.split('target/')[1] : "";

        TargetfileName = 'biocur' + '.' + target3 + '.' + targetText1;

        let filePath = "uploads/xmlfiles/" + TargetfileName + ".xml";
        var xml = document.toString({ pretty: true });
        fs.writeFile(filePath, xml, function (err) {
            if (err) { return console.log(err); }

        });

    }
    //  convert the XML tree to string

    // res.on("end", function () {
    //     var body = Buffer.concat(doc);
    //     console.log(body.toString());
    //     // Return data to client          
    //     serverRes.send(body.toString());

    //     console.log("body.toString()") body.toString();
    //   });

}


app.listen(PORT, function () {
    console.log('App listening on port ' + PORT);
});



