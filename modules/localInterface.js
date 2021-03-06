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
    mongodb.find('userList', {"token": req.headers.token}, (err, msg)=> {
      if(err) {
        return res.send({code: 201, data: err});
      } else {
        var data = {
          "adzone_id": msg[0].pid,
        }
        var babyInfo = [];
        mongodb.sortFind('order_details', data, (err, _msg)=> {
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
  app.post('/api/bindAlipay', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      mongodb.update('userList', {"token": req.headers.token}, {"alipayID" : body.apipayId, "userName": body.userName, "phone": body.phone}, (err, res2)=> {
        mongodb.find('userList', {"token": req.headers.token}, (err, res1)=> {
          return res.send({code: 200,data: res1[0]});
        })
      })
    });
  });
  // 提现申请接口
  app.post('/api/cashWithdrawalApplication', (req, res)=> {
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      mongodb.find('userList', {"token": req.headers.token}, (err, msg)=> {
        var userAmount = msg[0].amount;
        mongodb.insertOne('application', {"userName": body.userName, "alipayID": body.alipayID, amount: body.amount, "status": 0, "token": req.headers.token, "creatio_time": MyMethod.getNowFormatDate(0)}, (err, msg)=> {
          mongodb.update('userList', {"token": req.headers.token}, {"amount": (Number(userAmount) -  Number(body.amount)).toFixed(2)} ,(err, msg1)=> {
            mongodb.find('userList', {"token": req.headers.token}, (err, msg)=> {
              return res.send({code: 200, data:{amount: msg[0].amount}});
            })
          })
        })
      });
    });
  });
  // 查询申请提现记录
  app.get('/api/user/withdrawalsRecord', (req, res)=> {
    mongodb.sortFind('application', {"token": req.headers.token}, (err, msg)=> {
      return res.send({code: 200, data: msg});
    })
  })
  //获取用户信息
  app.get('/api/user/info', (req, res)=> {
    mongodb.find('userList', {"token": req.headers.token}, (err, res1)=> {
      return res.send({code: 200,data: res1[0]});
    })
  });
  // 结算接口
  app.get('/api/user/settlement', (req, res)=> {
    mongodb.find('userList', {}, (err, res1)=>{
      for (var i = 0; i < res1.length; i++) {
        mongodb.update('userList', {"token": res1[i].token}, {"estimated_revenue_last_month": Number(res1[i].estimated_revenue_the_month).toFixed(2), "estimated_revenue_the_month": "0.00","amount": (Number(res1[i].amount) + Number(res1[i].estimated_revenue_the_month)).toFixed(2)}, (err, msg)=> {
        })
      }
      return res.send({});
    })
  });
  // MyMethod.pwdJx('【【6期免息】Huawei/华为nova 5 Pro超级夜景4800万AI四摄超级快充屏内指纹NFC超广角景深手机】，椱ァ製这段描述¢IWlqY71ygd1€后到◇綯℡寳[来自88VIP的分享]');
  // 获取订单信息
  // create_time 创建时间 settle_time 结算时间
  // MyMethod.get_order_details('2019-01-07 12:15:35', 'settle_time');
  // MyMethod.get_order_details('2019-02-11 17:00:52', 'create_time');
  // var t = null ;
  // var num = 0;
  // t = setInterval(function(){
  //   MyMethod.get_order_details('', 'settle_time');
  // }, 3000);
  // clearInterval(t);
  // t = setInterval(function(){
  //   num ++;
  //   if((num % 2) == 1){
  //     MyMethod.get_order_details('', 'create_time');
  //   } else {
  //     MyMethod.get_order_details('', 'settle_time');
  //   }
  // }, 20000);
}
