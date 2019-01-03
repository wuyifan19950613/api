const mongodb = require('../mongodb.js');
const client = require('../taobaoApi.js');
const http = require("http");
const https = require("https");
const iconv = require("iconv-lite");
var MyMethod = require('./commonMethod.js'); //购物车路由
module.exports = function(app) {
  app.post('/api/addpid', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      var data = {
        pid: body.pid,
        status: false,
      }
      mongodb.insertOne('pid', data, (err, msg)=> {
        if (err) {
          return res.send({ code: 201,message:err});
        }
        return res.send({ code: 200,message:'添加成功'});
      });
    });
  });
}
