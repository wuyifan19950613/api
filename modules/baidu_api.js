var fs = require('fs');
var image = fs.readFileSync("public/images/ceshi.png").toString("base64");
var AipOcrClient = require("baidu-aip-sdk").ocr;

var multiparty = require('multiparty');
// 设置APPID/AK/SK
var APP_ID = "16927203";
var API_KEY = "7SUXCmnhiy7NRdrhUZsSg3NY";
var SECRET_KEY = "lGeNOSH7gqKZMvblxG8EpHRBFUOGvVXr";
var querystring = require("querystring");
// 新建一个对象，建议只保存一个对象调用服务接口
var client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);



module.exports = function(app) {
    app.post('/baidu/pictureRecognition',function (req, res) {
        var form = new multiparty.Form();
        form.parse(req, function (err, fields, files) {
            var file = {};
            console.log(fields)
            for (var i in files) {
                file = files[i][0];
            }
            var image = fs.readFileSync(file.path).toString("base64");
            client.accurateBasic(image).then(function(result) {
                res.send({code: 200, data: result});
            }).catch(function(err) {
                res.send({code: 201, error: err});
            });
        });
    });
}
