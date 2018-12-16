const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
const client = require('../taobaoApi.js');
const http = require("http");
const https = require("https");
const iconv = require("iconv-lite");
var request = require('request');
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
  request({
    url: 'http://gateway.kouss.com/tbpub/orderGet',
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    },
    body: {
      "fields":"tb_trade_parent_id,tk_status,tb_trade_id,num_iid,item_title,item_num,price,pay_price,seller_nick,seller_shop_title,commission,commission_rate,unid,create_time,earning_time,tk3rd_pub_id,tk3rd_site_id,tk3rd_adzone_id,relation_id",
      "start_time":"2018-12-12 00:00:00",
      "span":1200,
      "page_size":100,
      "tk_status":1,
      "order_query_type":"create_time",
      "session":"70000100c4844973c1cbd9e8b39753c9a39d169872f88da0dfec9dd80ee41f004cd5f881746586102"
    }
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var order_list = body.tbk_sc_order_get_response.results.n_tbk_order;
      for (var i = 0; i < order_list.length; i++) {
        mongodb.updateMany('order_details', {trade_id:order_list[i].trade_id}, order_list[i],(err, response)=>{
        });
      } 
    }
  });
}
