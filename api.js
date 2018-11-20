const express = require('express');
const app = express();
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
const base = require('./common.js')
var sha1 = require('sha1');
var xmlreader = require("xmlreader");
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

const config = {
  wechat:{
    appID:'wx26408a8b0b607e01', //填写你自己的appID
    appSecret:'edec6e5b252b8d1cac4bc1d32b986453', //填写你自己的appSecret
    token:'XiaoHuanYouJuan' //填写你自己的token
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

// http://wuyifan.free.idcfengye.com
app.get('/api/weixin', (req, res) => {
  console.log('21312')
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
app.post('/api/weixin', (req, res) => {
  var _da;
  const resData = res;
  console.log('1231')
  req.on("data",function(data){
    /*微信服务器传过来的是xml格式的，是buffer类型，因为js本身只有字符串数据类型，所以需要通过toString把xml转换为字符串*/
    _da = data.toString("utf-8");
  });
  req.on("end",function(){
    var text = '';
    // xml2js.parseString(_da, (err, res) => {
    //   console.log(res.xml.Content);
    // });
  xmlreader.read(_da, (err, res) => {
    if(null !== err ){
      return '';
    }
    text = res.xml.Content.text();
    var xxx = 'http://shop.xiaohuanzi.cn/commodity/listGoods?name='+text;
    var url = 'http://api.t.sina.com.cn/short_url/shorten.json?source=2815391962&url_long='+url_encode(xxx)
    console.log(url);
    var duanUrl = '';
    request(url, (err, res, body)=> {
      if (!err && res.statusCode == 200) {
         console.log() // Show the HTML for the baidu homepage.
         duanUrl = JSON.parse(body)[0].url_short;
         var ToUserName = getXMLNodeValue('ToUserName',_da);
         var FromUserName = getXMLNodeValue('FromUserName',_da);
         var CreateTime = getXMLNodeValue('CreateTime',_da);
         var MsgType = getXMLNodeValue('MsgType',_da);
         var Content = getXMLNodeValue('Content',_da);
         var MsgId = getXMLNodeValue('MsgId',_da);
         var html ='';
         html +='<xml>';
         html +='<ToUserName>'+FromUserName+'</ToUserName>';
         html +='<FromUserName>'+ToUserName+'</FromUserName>';
         html +='<CreateTime>'+CreateTime+'</CreateTime>';
         html +='<MsgType>'+MsgType+'</MsgType> ';
         html +=`<Content>亲，已为您找到“${text}”的相关商品\r\n\r\n点击购买☛购买☛${duanUrl}</Content>`;
         html +='</xml>';
         resData.send(html);
       }
     });
    });
  });
})



// 新增用户名
app.post('/api/user/register', (req, res) => {
  let body = "";
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    body = JSON.parse(body);
    const userName = body.userName;
    const password = body.password;
    if (!userName || !password) {
      const data = {
        code: 201,
        message: '账号密码不能为空',
      }
      return res.send(JSON.stringify(data));
    }
    const md5 = crypto.createHash("md5");
    let newPas = md5.update(password).digest("hex");
    const jsonData = {
      userName: userName,
      password: newPas,
    }
    mongodb.find('userList',{userName: userName}, (err, msg) => {
      if (msg.length > 0) {
        res.send({
          code: 202,
          message:'账号已存在',
        });
      } else {
        mongodb.insertOne('userList', jsonData, (err, msg)=> {
          if (err) {
            return err;
          }
          res.send({
            code: 200,
            message:'注册成功',
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
    const userName = body.userName;
    const password = body.password;
    const md5 = crypto.createHash("md5");
    let newPas = md5.update(password).digest("hex");
    mongodb.find('userList',{userName: userName}, (err, msg) => {
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
          userInfo: {
            userName: msg[0].userName,
            token:msg[0]._id,
          }
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
  https.get(url, (res) => {
    var html = "";
    res.on('data', (data) => {
      html += data;
    });
    res.on('end', () => {
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
  	'adzone_id':'57801250099',
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
app.get('/api/taobao/materialOptional', (req, res)=> {
  client.execute('taobao.tbk.dg.material.optional', {
    'page_size': `${req.query.pageSize}`,
    'page_no': `${req.query.pageNum}`,
    'adzone_id':'57801250099',
    'platform': '2',
    'sort': '_des,tk_rate',
    'q': `${req.query.searchName}`,
    'has_coupon': 'true',
  }, function(err, msg) {
    if (err) {
      return res.send({code:201, err: err});
    } else {
      return res.send({code:200, msg: msg});
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
