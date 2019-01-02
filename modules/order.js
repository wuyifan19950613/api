const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
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
      MyMethod.get_order_details(body.settle_time, 'settle_time', (msg)=> {
      });
      res.send({
        code: 200,
        message:'注册成功',
      });
    });
  });
}
