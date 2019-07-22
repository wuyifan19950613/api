const express = require('express');
const app = express();
let fs = require('fs-extra');
const moment = require('moment')
    //导入cors模块,该模块为跨域所用
const cors = require('cors');
const crypto = require("crypto");
const mongodb = require('./mongodb.js');
const url = require('url');
var request = require('request');
//解析表单的插件
const bodyParser = require('body-parser');
var https = require("https");
var superagent = require('superagent');
var cheerio = require('cheerio');
const ObjectId = require('mongodb').ObjectId;
const client = require('./taobaoApi.js')
const base = require('./common.js');
var sha1 = require('sha1');
const  uuidv1 = require('uuid/v1');
var xmlreader = require("xmlreader");
var shoppingcart = require('./modules/localInterface');
var wechatApplet = require('./modules/wechatApplet');
var order = require('./modules/order');
var pidArry = require('./modules/pid');
var MyMethod = require('./modules/commonMethod');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const config = {
  wechat:{
    appID:'wx26408a8b0b607e01', //填写你自己的appID
    appSecret:'edec6e5b252b8d1cac4bc1d32b986453', //填写你自己的appSecret
    token:'XiaoHuanYouJuan', //填写你自己的token
    access_token: '',
  }
};

function getXMLNodeValue(node_name,xml){
    var tmp = xml.split("<"+node_name+">");
    var _tmp = tmp[1].split("</"+node_name+">");
    return _tmp[0];
}
function url_encode(url){
    url = encodeURIComponent(url);
    url = url.replace(/\%3A/g, ":");
    url = url.replace(/\%2F/g, "/");
    url = url.replace(/\%3F/g, "?");
    url = url.replace(/\%3D/g, "=");
    url = url.replace(/\%26/g, "&");
    return url;
}
// 自动回复处理
function recProcess(Wxcofig, resData, site_name) {
  var html ='';
  html +='<xml>';
  html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
  html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
  html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
  html +='<MsgType><![CDATA[text]]></MsgType>';
  html +=`<Content>(≖ᴗ≖)✧ Hello，我是${site_name}\r\n请按以下说明领取优惠券。\r\n\r\n❶直接发送宝贝链接给我，可以自动查找优惠，90%商品都能找到，详情点击菜单帮助！\r\n\r\n❷发送“XXX”会给您查找有优惠券的商品，比如：卫衣。\r\n\r\n❸直接打开小欢有劵官网：http://www.xiaohuanzi.cn (复制地址用浏览器打开)</Content>`;
  html +='</xml>';
  return resData.send(html);
}
shoppingcart(app);
wechatApplet(app);
order(app);
pidArry(app);
// http://wuyifan.free.idcfengye.com
// 微信机器人自动回复
app.get('/api/wechatRobot', (req, res)=> {
  var url = req.query.url;
  var text = req.query.text;
  var resData = res;
  if (url) {
    if(url.indexOf('https') != -1){
      // 如果连接带有id就直接获取id
      if(url.indexOf('?id') != -1){
        const id = base.getUrlParam(url);
        // wechatOutReply(id, Wxcofig, resData);
        wechatRobotOutReply(id, res)
        return false;
      }
      MyMethod.dismantlID(url,(id)=> {
        wechatRobotOutReply(id, res);
      })
    }
  } else if (text) {
    var short_links = 'http://www.xiaohuanzi.cn/search?searchName='+text;
    var trans_url = 'http://api.t.sina.com.cn/short_url/shorten.json?source=2815391962&url_long='+url_encode(short_links);
    var duanUrl = '';
    request(trans_url, (err, res, body)=> {
      if (!err && res.statusCode == 200) {
        var html ='';
         duanUrl = JSON.parse(body)[0].url_short;
         html +=`兄dei，以为你找到【${text}】相关商品\r\n\r\n点击购买☛${duanUrl}\r\n\r\n网站收录商品有限，建议直接分享淘宝链接查询优惠~`;
         return resData.send(html);
       }
     });
  }
})
app.get('/api/weixin', (req, res) => {
  var token = config.wechat.token;
  var signature = req.query.signature;
  var nonce = req.query.nonce;
  var timestamp = req.query.timestamp;
  var echostr = req.query.echostr;
  var str = [token,timestamp,nonce].sort().join('');
  var sha = sha1(str);
  if (signature === sha) {
    return res.send(echostr);
  } else {
    console.log('error');
  }
});
app.get('/api/smallProgram', (req, res)=> {
  var text = req.query.text;
  if(text.indexOf('https') != -1){
    // 如果连接带有id就直接获取id
    if(text.indexOf('?id') != -1){
      const id = base.getUrlParam(text);

      return res.send({code: 200,message:{id: id},});
    }else {
      var url = text.substring(text.indexOf('https:'), text.indexOf('点击链接'));
      MyMethod.dismantlID(url,(id)=> {
        return res.send({code: 200,message:{id: id},});
      })
    }
  } else {
    return res.send({code :201, message:'未发现商品'})
  }
})
app.post('/api/weixin', (req, res) => {
  var token = req.query.token;
  base.Distinguish(token, (_msg)=> {
    var _da;
    const resData = res;
    req.on("data",function(data){
      /*微信服务器传过来的是xml格式的，是buffer类型，因为js本身只有字符串数据类型，所以需要通过toString把xml转换为字符串*/
      _da = data.toString("utf-8");
    });
    req.on("end",function(){
      var text = '';
    xmlreader.read(_da, (err, res) => {
      if(null !== err ){
        return '';
      }
      const Wxcofig = {
        ToUserName: getXMLNodeValue('ToUserName',_da),
        FromUserName: getXMLNodeValue('FromUserName',_da),
        CreateTime: getXMLNodeValue('CreateTime',_da),
        MsgType: getXMLNodeValue('MsgType',_da),
      }
      if(JSON.stringify(_msg) == '[]'){
        var html ='';
        html +='<xml>';
        html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
        html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
        html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
        html +='<MsgType>'+Wxcofig.MsgType+'</MsgType> ';
        html +=`<Content>更新中，给你带来不便，请谅解！</Content>`;
        // html +=`<Content>你的账户暂时没有权限,请前往http://www.xiaohuanzi.cn/admin/register</Content>`;
        html +='</xml>';
        return resData.send(html);
      }
      var Rebate = _msg[0].Rebate; // 返利比例
      var site_name = _msg[0].site_name; // 网站名称 （小欢有）
      var pid = _msg[0].pid;
      if (res.xml.MsgType.text() == 'image' || res.xml.MsgType.text() == 'event' || res.xml.MsgType.text() == 'voice') {
          recProcess(Wxcofig, resData, site_name);
          return false;
      }
      if (res.xml.MsgType.text() == 'text') {
        text = res.xml.Content.text();
        if (text == '【收到不支持的消息类型，暂无法显示】'|| text.indexOf("/:") != -1) {
          recProcess(Wxcofig, resData, site_name);
          return false;
        }
        console.log(text)
        MyMethod.pwdJx(text, (result)=> {
          console.log(result);
          if (result.code == 200) {
            wechatOutReply(result.data,Wxcofig ,resData, Rebate, pid);
          } else {
            var html ='';
                html +='<xml>';
                html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
                html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
                html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
                html +='<MsgType>'+Wxcofig.MsgType+'</MsgType> ';
                html +=`<Content>兄dei，请直接分享宝贝链接搜索哦~\r\n不是标题哦！</Content>`;
                html +='</xml>';
                return resData.send(html);
          }
        })
        // 如果带有链接
        // if(text.indexOf('https') != -1){
        //   // 如果连接带有id就直接获取id
        //   if(text.indexOf('?id') != -1){
        //     const id = base.getUrlParam(text);
        //     wechatOutReply(id, Wxcofig, resData, Rebate, pid);
        //     return false;
        //   }
        //   var url = text.substring(text.indexOf('https:'), text.indexOf('点击链接'));
        //   MyMethod.dismantlID(url,(id)=> {
        //     wechatOutReply(id,Wxcofig ,resData, Rebate, pid);
        //   })
        // } else{
        //   // var short_links = 'http://www.xiaohuanzi.cn/search?searchName='+text;
        //   // var trans_url = 'http://api.t.sina.com.cn/short_url/shorten.json?source=2815391962&url_long='+url_encode(short_links);
        //   // var duanUrl = '';
        //   // request(trans_url, (err, res, body)=> {
        //   //   if (!err && res.statusCode == 200) {
        //       var html ='';
        //   //      duanUrl = JSON.parse(body)[0].url_short;
        //        html +='<xml>';
        //        html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
        //        html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
        //        html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
        //        html +='<MsgType>'+Wxcofig.MsgType+'</MsgType> ';
        //        html +=`<Content>兄dei，请直接分享宝贝链接搜索哦~\r\n不是标题哦！</Content>`;
        //        html +='</xml>';
        //        return resData.send(html);
        //    //   }
        //    // });
        // }
       }
      });
    });
  });
});
function wechatRobotOutReply(id,resData){
  var taobaoUrl = `https://item.taobao.com/item.htm?id=${id}`;
  client.execute('taobao.tbk.dg.material.optional', {
    'adzone_id':'57801250099',
    'platform': '2',
    'sort': '_des,tk_rate',
    'q': `${taobaoUrl}`,
  }, function(err, msg) {
    if (err) {
      var html ='';
      html +=`很抱歉，该宝贝暂时无优惠，试试其他宝贝吧~`;
      return resData.send(html);
    } else {
      var map_data = msg.result_list.map_data[0];
      var num_iid = map_data.num_iid;
      var coupon_info = map_data.coupon_info == '' ? '0' : base.CouponNum(map_data.coupon_info);
      var coupon_share_url = map_data.coupon_share_url ? map_data.coupon_share_url : map_data.url;
      delete(map_data.num_iid);
      delete(map_data.coupon_info);
      delete(map_data.coupon_share_url);
      map_data.item_id = num_iid;
      map_data.coupon_click_url = coupon_share_url;
      map_data.coupon_amount = coupon_info;
      mongodb.updateMany('product_list',{item_id:map_data.item_id}, map_data,(err, response)=>{
      })
      var short_links = 'http://www.xiaohuanzi.cn/shopDetail?item_id='+parseInt(id);
      var trans_url = 'http://api.t.sina.com.cn/short_url/shorten.json?source=2815391962&url_long='+url_encode(short_links);
      var redenvelopes = Math.floor((Math.floor((map_data.commission_rate / 100).toFixed(2) * (map_data.zk_final_price - map_data.coupon_amount)) / 100) * 0.7 * 100) / 100;
      request(trans_url, (err, res, body)=> {
        if (!err && res.statusCode == 200) {
          var html ='';
           duanUrl = JSON.parse(body)[0].url_short;
           html +=`兄dei，${map_data.title}\r\n\r\n现售价：${map_data.zk_final_price}元\r\n优惠券：${map_data.coupon_amount}元\r\n返红包：${redenvelopes}元\r\n\r\n点击购买☛${duanUrl}`;
           return resData.send(html);
         }
       });
    }
  })

}
function wechatOutReply(id, Wxcofig, resData, Rebate, pid) {
  var taobaoUrl = `https://item.taobao.com/item.htm?id=${id}`;
  client.execute('taobao.tbk.dg.material.optional', {
    // 'adzone_id': '81254050461',
    'adzone_id': pid,
    'platform': '2',
    'sort': '_des,tk_rate',
    'q': `${taobaoUrl}`,
  }, function(err, msg) {
    console.log(err);
    if (err) {
      var html ='';
      html +='<xml>';
      html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
      html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
      html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
      html +='<MsgType>'+Wxcofig.MsgType+'</MsgType> ';
      html +=`<Content>很抱歉，该宝贝暂时无优惠，试试其他宝贝吧~</Content>`;
      html +='</xml>';
      return resData.send(html);
    } else {
      var map_data = msg.result_list.map_data[0];
      var num_iid = map_data.num_iid;
      var coupon_info = map_data.coupon_info == '' ? '0' : base.CouponNum(map_data.coupon_info);
      var coupon_share_url = map_data.coupon_share_url ? map_data.coupon_share_url : map_data.url;
      delete(map_data.num_iid);
      delete(map_data.coupon_info);
      delete(map_data.coupon_share_url);
      map_data.item_id = num_iid;
      map_data.coupon_click_url = coupon_share_url;
      map_data.coupon_amount = coupon_info;
      mongodb.updateMany('product_list',{item_id:map_data.item_id}, map_data,(err, response)=>{
      })
      var short_links = 'http://www.xiaohuanzi.cn/shopDetail?item_id='+parseInt(id);
      var trans_url = 'http://api.t.sina.com.cn/short_url/shorten.json?source=2815391962&url_long='+url_encode(short_links);
      var redenvelopes = Math.floor((Math.floor((map_data.commission_rate / 100).toFixed(2) * (map_data.zk_final_price - map_data.coupon_amount)) / 100) * Number(Rebate) * 100) / 100;
      request(trans_url, (err, res, body)=> {
        if (!err && res.statusCode == 200) {
          var html ='';
           duanUrl = JSON.parse(body)[0].url_short;
           html +='<xml>';
           html +='<ToUserName>'+Wxcofig.FromUserName+'</ToUserName>';
           html +='<FromUserName>'+Wxcofig.ToUserName+'</FromUserName>';
           html +='<CreateTime>'+Wxcofig.CreateTime+'</CreateTime>';
           html +='<MsgType>'+Wxcofig.MsgType+'</MsgType> ';
           html +=`<Content>兄dei，${map_data.title}\r\n\r\n现售价：${map_data.zk_final_price}元\r\n优惠券：${map_data.coupon_amount}元\r\n返红包：${redenvelopes}元\r\n\r\n点击购买☛${duanUrl}</Content>`;
           html +='</xml>';
           return resData.send(html);
         }
       });
    }
  })
}
// 新增用户名
app.post('/api/user/register', (req, res) => {
  let body = "";
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    body = JSON.parse(body);
    const Email = body.Email;
    const password = body.password;
    const promoCode = body.promoCode;
    if (!Email || !password) {
      const data = {
        code: 201,
        message: '账号密码不能为空',
      }
      return res.send(JSON.stringify(data));
    }
    const md5 = crypto.createHash("md5");
    let newPas = md5.update(password).digest("hex");
    const jsonData = {
      Email: Email,
      password: newPas,
      type: 1,
      Rebate: '0.5',
      site_name: '小欢有劵',
      superior_id: promoCode,
      pid: '',
      token: uuidv1(),
      spread_code: MyMethod.randomNumber(8),
      amount: 0, //可提现余额
      estimated_revenue_the_month: 0,
      estimated_revenue_last_month: 0,
    }
    mongodb.find('userList',{Email: Email}, (err, msg) => {
      if (msg.length > 0) {
        res.send({
          code: 202,
          message:'账号已存在',
        });
      } else {
        mongodb.find('pid', {status: false}, (err, msg)=> {
          jsonData.pid = msg[0].pid;
          mongodb.insertOne('userList', jsonData, (err, msg1)=> {
            if (err) {
              return err;
            }
            mongodb.update('pid',{"pid": msg[0].pid},{'status': true}, (err, msg2)=> {
              mongodb.find('userList', {"spread_code": promoCode}, (err, msg3)=> {
                var fans_number = parseInt(msg3[0].fans_number) + 1;
                mongodb.update('userList', {"spread_code": promoCode}, {"fans_number": fans_number}, (err, msg4)=> {
                  res.send({
                    code: 200,
                    message:'注册成功',
                  });
                })
              })
            })
          });
        });
      }
    });
  });
})

// 登录
app.post('/api/user/login', (req, res) => {
  let body = "";
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    body = JSON.parse(body);
    const Email = body.Email;
    const password = body.password;
    const md5 = crypto.createHash("md5");
    let newPas = md5.update(password).digest("hex");
    mongodb.find('userList',{Email: Email}, (err, msg) => {
      if(err) {
        return res.send({code: 201, data: err});
      }
      if (JSON.stringify(msg) == '[]') {
        res.send({
          code: 201,
          message:'账号不存在',
        });
        return false;
      }
      if (newPas === msg[0].password) {
        res.send({
          code: 200,
          message:'登录成功',
          userInfo: msg[0]
        });
        return false;
      } else {
        res.send({
          code: 201,
          message:'账号或密码错误',
        });
      }
    })
  })
});

// 抓取数据
app.get('/api/grabbing/data', (req, res) => {
  const url = req.query.url;
  https.get(url, (msg) => {
    var html = "";
    msg.on('data', (data) => {
      html += data;
    });
    msg.on('end', () => {
    })
  })
});

// 添加商品数据
app.post('/api/add/goods', (req, res) => {
  let body = "";
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    body = JSON.parse(body);
    mongodb.find('commodity',{title: body.title}, (err, msg) => {
      if (msg.length > 0) {
        return res.send({code: 202,message:'数据已存在',});
      } else {
        mongodb.insertOne('commodity', body, (err, msg)=> {
          if(err) {
            return err;
          }
          res.send({
            code: 200,
            message: '添加成功',
          })
        })
      }
    })
  });
})
// 根据分类查询商品
app.get('/api/find/typeCommodity', (req, res)=> {
  let data = {};
  if(req.query.type) {
    data = {
      type : req.query.type,
    };
  }
  mongodb.find('commodity', data, (err, msg) => {
    if(err) {
      return res.send({code: 201, data: err});
    } else {
      return res.send({code: 200,data: msg});
    }
  });
});

// 	淘宝客商品查询 如：女装
app.get('/api/taobao/CommodityFind', (req, res)=> {
  client.execute('taobao.tbk.dg.item.coupon.get', {
  	'adzone_id':'57801250099',
    'q': `${req.query.commodityName}`,
    'platform':'2',
    'page_no': `${req.query.pageNum}`,
    'page_size': `${req.query.pageSize}`,
  }, (err, msg)=> {
    if (err){
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});

// 淘宝订单查询 （不可用）
app.get('/api/taobao/orderInfoSearch', (req, res)=> {
  client.execute('taobao.tbk.order.details.get', {
    'end_time': '2019-04-23 12:28:22',
    'start_time': '2019-04-05 12:18:22',
  }, (err, msg)=> {
    if (err){
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});

// 淘宝客口令解析
app.get('/api/taobao/pwdAnalysis', (req, res)=> {
  client.execute('taobao.tbk.tpwd.convert', {
    'password_content': '【抽纸批发整箱40包雪亮家庭装婴儿卫生纸巾家用餐巾纸面巾纸实惠装】，椱ァ製这段描述¢nzhEYSPmvi6¢后到◇綯℡寳[来自88VIP的分享]',
  }, (err, msg)=> {
    if (err){
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});



// 淘宝商品详情（简版）
app.get('/api/taobao/CommodityDetails', (req, res) => {
  client.execute('taobao.tbk.item.info.get', {
  	'num_iids': `${req.query.num_iid}`,
  	'platform':'2',
  }, (err, msg)=> {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg.results.n_tbk_item[0]});
    }
  })
});
// 淘宝商品猜你喜欢（简版）
app.get('/api/taobao/guessLike', (req, res)=> {
  client.execute('taobao.tbk.item.guess.like', {
    'adzone_id':'57801250099',
    'os': base.phoneModel(req),
    'ip': req.header('x-forwarded-for') || req.connection.remoteAddress,
    'ua': `${req.query.ua}`,
    'net': `wifi`,
    'page_size': `${req.query.pageSize}`,
    'page_no': `${req.query.pageNum}`,
  }, (err, msg)=> {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg.results.n_tbk_item[0]});
    }
  })
});

// 淘口令生成
app.get('/api/taobao/pwdCreate', (req, res)=> {
  client.execute('taobao.tbk.tpwd.create', {
  	'user_id':'1746586102',
  	'text':`${req.query.title}`,
  	'url': `${req.query.url}`,
  	'logo':`${req.query.logo}`,
  }, function(err, msg) {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});

// 淘宝客物料下行-导购
app.get('/api/taobao/optimusMaterial', (req, res)=> {
  client.execute('taobao.tbk.dg.optimus.material', {
  	'page_size': `${req.query.pageSize}`,
  	'adzone_id': req.query.pid ? req.query.pid  :  '57801250099',
  	'page_no': `${req.query.pageNum}`,
  	'material_id': `${req.query.material_id}`,
  }, function(err, msg) {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});

// ( 淘宝客-推广者-物料搜索 )
app.get('/api/taobao/materialOptional', (req, res)=> {
  client.execute('taobao.tbk.dg.material.optional', {
    'page_size': `${req.query.pageSize}`,
    'page_no': `${req.query.pageNum}`,
  	'adzone_id': req.query.pid ? req.query.pid  :  '57801250099',
    'platform': '2',
    'sort': '_des,tk_rate',
    'q': `${req.query.searchName}`,
  }, function(err, msg) {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
    }
  })
});

// ( 淘宝客-公用-商品关联推荐 )
app.get('/api/taobao/recommend', (req, res)=> {
  client.execute('taobao.tbk.item.recommend.get', {
  	'fields':'num_iid,volume,title,pict_url,small_images,coupon_info,reserve_price,zk_final_price,user_type,provcity,item_url',
  	'num_iid':`${req.query.num_iid}`,
  	'count':'20',
  	'platform':'2'
  }, function(error, response) {
    if (error) {
      return res.send({code:201, err: error});
    } else {
      return res.send({code:200, data: response});
    }
  })
})

// ( 淘宝客-公用-链接解析出商品id ) (不可用)
app.get('/api/taobao/getCommodityId', (req, res)=> {
  client.execute('taobao.tbk.item.click.extract', {
    'click_url':'https://detail.tmall.com/item.htm?id=585623792035&ali_trackid=2:mm_26632614_0_0:1563500643_281_459009505&spm=a21bo.7925890.192091.3'
  }, function(error, response) {
    if (error) {
      return res.send({code:201, err: error});
    } else {
      return res.send({code:200, data: response});
    }
  })
})

// 根据id查询商品
app.get('/api/find/CommodityId', (req, res)=> {
  mongodb.find('commodity',{"_id": ObjectId(req.query.id)}, (err, msg) => {
    if(err) {
      return res.send({code: 201, data: err});
    }
    res.send({
      code: 200,
      data: msg[0]
    })
  });
});

// 模糊查询
app.get('/api/vaguefind/Commodity', (req, res) => {
  const data ={
    title: new RegExp(req.query.title),
  }
  mongodb.find('commodity', data, (err, msg)=> {
    if (err) {
      return res.send({code: 201, data: err});
    }
    if (req.query.id) {
      let index = '';
      for (let i = 0; i < msg.length; i+=1) {
        if (req.query.id == msg[i]._id) {
          index = i;
          msg = msg.splice(1,1);
        }
        return res.send({code: 200,data: msg})
      }
    } else {
      return res.send({code: 200,data: msg,})
    }
  });
});
app.listen(3000,'0.0.0.0',() => {
    console.log('服务启动成功');
})
