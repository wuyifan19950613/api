const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
const client = require('../taobaoApi.js');
const http = require("http");
const https = require("https");
const iconv = require("iconv-lite");
var MyMethod = require('./commonMethod.js'); //购物车路由
module.exports = function(app) {
  app.post('/api/addIndexBanner', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      mongodb.insertOne('banner', {imgUrl: body.imgUrl, imgHref: body.imgHref,imgMark: body.imgMark}, (err, msg)=> {
        if (err) {
          return err;
        }
        res.send({});
      });
    });
  });
  app.get('/api/getIndexBanner', (req, res)=> {
    mongodb.find('banner', {}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  app.delete('/api/removeIndexBanner',(req, res)=> {
    mongodb.deleteOne('banner', {"_id": ObjectId(req.query.id)}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  app.post('/api/addNavigation', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      mongodb.insertOne('navigation', {title: body.title, navId: body.navId}, (err, msg)=> {
        if (err) {
          return err;
        }
        res.send({});
      });
    });
  });
  app.post('/api/Neworder', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      console.log(body);
      // mongodb.insertOne('order_details', {title: body.title, navId: body.navId}, (err, msg)=> {
      //   if (err) {
      //     return err;
      //   }
      //   res.send({});
      // });
    });
  });
  app.get('/api/getNavigation', (req, res)=> {
    mongodb.find('navigation', {}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  app.delete('/api/removeNavigation',(req, res)=> {
    mongodb.deleteOne('navigation', {"_id": ObjectId(req.query.id)}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  // 获取商品id
  app.get('/api/getcommodityId',(req, res) => {
    const url = req.query.url;
    https.get(url, (res)=> {
      var datas = [];
      var size = 0;
      res.on('data', function (data) {
       datas.push(data);
       size += data.length;
     });
     res.on("end", function () {
      var buff = Buffer.concat(datas, size);
      var result = iconv.decode(buff, "utf8");//转码//var result = buff.toString();//不需要转编码,直接tostring
      var id = result.substring(result.indexOf("https://a.m.taobao.com/i")+1,result.indexOf('.htm?')).replace(/[^0-9]/ig,"");;
      });
    })
  });
  app.get('/api/getUpdateCommdity', (req, res)=> {
    client.execute('taobao.tbk.dg.optimus.material', {
      'adzone_id':'57801250099',
      'page_no': `${req.query.page_no}`,
      'page_size': 20,
      'material_id': `${req.query.material_id}`,
    }, function(err, msg) {
      if (err) {
        return res.send({code:201, msg: err.sub_msg});
      } else {
        // mongodb.insertMany('product_list', msg.result_list.map_data, (err, response)=> {
        //   return res.send({code:200, msg: response.insertedCount});
        // });
        var map_data = msg.result_list.map_data;
        for (var i=0; i < map_data.length; i++){
          mongodb.updateMany('product_list',{item_id:map_data[i].item_id}, map_data[i],(err, response)=>{
          })
        }
        return res.send({code:200, msg: '更新成功'});
      }
    })
  });
  app.post('/api/updateType', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      for (var i=0; i < body.length; i++){
        mongodb.updateMany('product_list',{item_id:body[i].item_id}, body[i],(err, response)=>{
        });
      }
      return res.send({code:200, msg: '更新成功'});
    });

  });
  // 商品详情接口信息
  app.get('/api/getCommodityDetails', (req, res)=> {
    mongodb.find('product_list', {"item_id": parseInt(req.query.item_id)}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  // 订单查询
  app.get('/api/orderInquiry', (req, res)=> {
    mongodb.find('userList', {"_id": ObjectId(req.headers.token)}, (err, msg)=> {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        var data = {};
        if (req.query.trade_id) {
          data = {
            "trade_id": req.query.trade_id ? parseInt(req.query.trade_id) : '',
          }
        }else if (req.query.tk_status !== '1') {
          data = {
            adzone_id: msg[0].pid,
            "tk_status": req.query.tk_status ? parseInt(req.query.tk_status) : '',
          };
        } else {
          data = {
            adzone_id: msg[0].pid,
          }
        }
        mongodb.find('order_details', data, (err, _msg)=> {
          if(err) {
            return res.send({code: 201, data: err});
          } else {
            return res.send({code: 200,data: _msg});
          }
        });
      }
    })
  });
  app.get('/api/modifyingData', (req, res)=> {
    var userName = req.query.userName;
    var site_name = req.query.site_name;
    var Rebate = req.query.Rebate;
    var id = req.query.id;
    mongodb.update('userList',{"_id": ObjectId(req.query.id)}, {"userName": userName, "site_name": site_name, "Rebate": Rebate},(err, response)=>{
      mongodb.find('userList', {"_id": ObjectId(req.query.id)}, (err, msg)=> {
        if(err) {
          return res.send({code: 201, data: err});
        } else {
          return res.send({code: 200,data: msg[0]});
        }
      })
    });
  });
  app.get('/api/userEdit', (req, res)=> {
    var type = req.query.type;
    var pid = req.query.pid;
    var id = req.query.id;
    mongodb.update('userList',{"_id": ObjectId(req.query.id)}, {"type": type, "pid": pid},(err, response)=>{
      mongodb.find('userList', {"_id": ObjectId(req.query.id)}, (err, msg)=> {
        if(err) {
          return res.send({code: 201, data: err});
        } else {
          return res.send({code: 200,data: msg[0]});
        }
      })
    });
  });
  app.get('/api/userAll', (req, res)=> {
    mongodb.find('userList', {}, (err, msg)=> {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        return res.send({code: 200,data: msg});
      }
    });
  });
  // 获取订单信息
  MyMethod.get_order_details();
}
