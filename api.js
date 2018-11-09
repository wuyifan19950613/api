const express = require('express');
const app = express();
const moment = require('moment')
    //导入cors模块,该模块为跨域所用
const cors = require('cors');
const crypto = require("crypto");
const mongodb = require('./mongodb.js');
const url = require('url');
//解析表单的插件
const bodyParser = require('body-parser');
var https = require("https");
var superagent = require('superagent');
var cheerio = require('cheerio');
const ObjectId = require('mongodb').ObjectId;

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors());

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
        return err;
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
        res.send({
          code: 202,
          message:'数据已存在',
        });
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
      return err
    }
    res.send({
      code: 200,
      data: msg,
    })
  });
});
// 根据id查询商品
app.get('/api/find/CommodityId', (req, res)=> {
  mongodb.find('commodity',{"_id": ObjectId(req.query.id)}, (err, msg) => {
    if(err) {
      return err
    }
    res.send({
      code: 200,
      data: msg[0],
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
      return err
    }
    if (req.query.id) {
      let index = '';
      for (let i = 0; i < msg.length; i+=1) {
        if (req.query.id == msg[i]._id) {
          index = i;
          msg = msg.splice(1,1);
        }
        res.send({
          code: 200,
          data: msg,
        })
      }
    } else {
      res.send({
        code: 200,
        data: msg,
      })
    }
  });
});
app.listen(3000, () => {
    console.log('正在监听端口3000,http://192.168.0.16:3000');
})
