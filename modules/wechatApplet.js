const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
const client = require('../taobaoApi.js');
const http = require("http");
const https = require("https");
const iconv = require("iconv-lite");
var MyMethod = require('./commonMethod.js'); //购物车路由
const globalData = {
  appid: 'wxe8a6c0f7f936eb6c',
  secret: '4b2c8c306af08641cc760bc21cc8929b',
}
// const templateId = {
//   // 订单支付成功通知
//   orderPaySuccess: {
//     template_id: 'sptBiyEVlnmf6kMqHdKWZY9coHUbzN294ylNFbkeg1g',
//   },
// }
// 自动发送模版通知
// var baseCommon = {
//   autoSendTemplate: function (options) {
//     var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+globalData.appid+'&secret='+globalData.secret+''
//     https.get(url, (res)=> {
//       var datas = [];
//       var size = 0;
//       res.on('data', function (data) {
//        datas.push(data);
//        size += data.length;
//      });
//      res.on("end", function () {
//         var buff = Buffer.concat(datas, size);
//         var result = iconv.decode(buff, "utf8");
//         var access_token = JSON.parse(result).access_token;
//         var postData = JSON.stringify({
//           // access_token: body.access_token,
//           touser : options.touser,
//           template_id : 'sptBiyEVlnmf6kMqHdKWZY9coHUbzN294ylNFbkeg1g',
//           page : options.page,
//           form_id : options.form_id,
//           data : options.data
//         })
//         let options ={
//           hostname:'api.weixin.qq.com',
//           path:'/cgi-bin/message/wxopen/template/send?access_token=' + access_token,
//           method:'POST',
//           headers:{
//           'Content-Type': 'application/json',
//           'Content-Length': Buffer.byteLength(postData)
//           }
//         }
//         let req = https.request(options, res => {
//           let dd = '';
//           res.on('data', secCheck => {
//             dd += secCheck;
//           });
//           res.on('end', secCheck => {
//             console.log(dd);
//           })
//           res.on('error', err => {
//             console.log(err);
//           });
//         });
//         req.write(postData);
//         req.end();
//       });
//     })
//   }
// };
// baseCommon.autoSendTemplate();

module.exports = function(app) {
  // 获取微信用户的openid
  app.get('/api/applet/userinfo', (req, res)=> {
    var that = res;
    var global = {
      appid: req.query.appid,
      secret: req.query.secret,
      code: req.query.code,
    }
    var url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + global.appid + '&secret=' + global.secret + '&js_code=' + global.code + '&grant_type=authorization_code';
    https.get(url, (res)=> {
      var datas = [];
      var size = 0;
      res.on('data', function (data) {
       datas.push(data);
       size += data.length;
     });
     res.on("end", function () {
        var buff = Buffer.concat(datas, size);
        var result = iconv.decode(buff, "utf8");
        mongodb.find('weChatUsers', {openid: JSON.parse(result).openid}, (err, res)=> {
          if (res.length > 0) {
            var wxUserInfo = JSON.parse(result);
            wxUserInfo.pid = res[0].pid;
            that.send({data: wxUserInfo});
          } else {
            mongodb.find('pid', {status: false}, (err, msg)=> {
              mongodb.update('pid',{"pid": msg[0].pid},{'status': true}, (err, msg2)=> {
                mongodb.updateMany('weChatUsers', {openid: JSON.parse(result).openid}, {openid: JSON.parse(result).openid, pid: msg[0].pid,}, (err, msg)=> {
                  if (err) {
                    return err;
                  }
                  mongodb.find('weChatUsers', {openid: JSON.parse(result).openid}, (err, msg3)=> {
                    that.send({data: msg3[0]});
                  });
                });
              })
            });
          }
        })
      });
    })
  });
  // 获取小程序access_token
  app.get('/api/applet/access_token', (req, res)=> {
    var that = res;
    var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+globalData.appid+'&secret='+globalData.secret+''
    https.get(url, (res)=> {
      var datas = [];
      var size = 0;
      res.on('data', function (data) {
       datas.push(data);
       size += data.length;
     });
     res.on("end", function () {
        var buff = Buffer.concat(datas, size);
        var result = iconv.decode(buff, "utf8");
        that.send({data:JSON.parse(result)});
      });
    })
  });
  // 发送模板消息
  app.post('/api/applet/sendTemplateMessage', (req, res)=> {
    var that = res;
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      var access_token = body.access_token;
      var postData = JSON.stringify({
        // access_token: body.access_token,
        touser : body.touser,
        template_id : body.template_id,
        page : body.page,
        form_id : body.form_id,
        data : body.data,
      })
      let options ={
        hostname:'api.weixin.qq.com',
        path:'/cgi-bin/message/wxopen/template/send?access_token=' + access_token,
        method:'POST',
        headers:{
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
        }
      }
      let req = https.request(options, res => {
        let dd = '';
        res.on('data', secCheck => {
          dd += secCheck;
        });
        res.on('end', secCheck => {
          that.send({data: dd})
        })
        res.on('error', err => {
          console.log(err);
        });
      });
      req.write(postData);
      req.end();
    });

  });

  // 储存form_id;
  app.post('/api/applet/modifyFormId', (req, res)=> {
    var that = res;
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      console.log(body)
      mongodb.find('weChatUsers', {"openid": body.openid}, (err, res)=> {
        mongodb.update('weChatUsers', {"openid": body.openid }, {"form_id": body.formId} , (err, res)=> {
          that.send({data: res})
        })
      });
    });
  });
  // 小程序banner图
  app.post('/api/applet/addbanner', (req, res)=> {
    var that = res;
    let body = "";
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      body = JSON.parse(body);
      mongodb.insertOne('appletbanner', {imgUrl: body.imgUrl, imgHref: body.imgHref,imgMark: body.imgMark}, (err, msg)=> {
        if (err) {
          return err;
        }
        res.send({});
      });
    });
  });
  app.get('/api/applet/banner', (req, res)=> {
    var that = res;
    mongodb.find('appletbanner', {}, (err, res)=> {
      that.send({data: res})
    })
  })
  // 拼多多切换
  app.get('/api/applet/examine', (req, res)=> {
    res.send({data: true})
  })
}
