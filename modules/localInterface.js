const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
const client = require('../taobaoApi.js')
const https = require("https");
const iconv = require("iconv-lite");
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
      console.log(id);
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
        return res.send({code:201, err: err});
      } else {
        var map_data = msg.result_list.map_data;
        for (var i=0; i < map_data.length; i++){
          mongodb.updateMany('product_list',{item_id:map_data[i].item_id}, map_data[i]);
        }
        return res.send({code:200, msg: '更新成功'});
      }
    })
  });
}
