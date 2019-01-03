const mongodb = require('../mongodb.js');
const client = require('../taobaoApi.js');
const http = require("http");
const https = require("https");
const iconv = require("iconv-lite");
var MyMethod = require('./commonMethod.js'); //购物车路由
module.exports = function(app) {
  app.put('/api/orderStatusUpdate', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      MyMethod.get_order_details(body.settle_time, body.status == 0 ? 'create_time' : 'settle_time', (msg)=> {
      });
      res.send({
        code: 200,
        message:'更新成功',
      });
    });
  });
  // 查询粉丝
  app.get('/api/queryFans', (req, res)=> {
    var token = req.headers.token;
    mongodb.find('userList', {"token": req.headers.token}, (err, msg)=> {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        var codeArry = [];
        var fansArry = [];
        var code = msg[0].spread_code;
        mongodb.find('userList', {"superior_id": code}, (err, msg1)=> {
          var codeArry = [];
          for (var i = 0 ; i < msg1.length; i++) {
            codeArry.push(msg1[i].spread_code)
            fansArry.push(msg1[i]);
          }
          mongodb.find('userList', {"superior_id": {$in: codeArry}}, (err, msg2)=> {
            for (var i = 0; i < msg2.length; i ++) {
              fansArry.push(msg2[i]);
            }
            return res.send({code: 200, data: fansArry});
          })
        })
      }
    })
  })
}
