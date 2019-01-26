const mongodb = require('./mongodb.js');
const https = require("https");
const iconv = require("iconv-lite");
const globalData = {
  appid: 'wxe8a6c0f7f936eb6c',
  secret: '4b2c8c306af08641cc760bc21cc8929b',
}
const templateId = {
  // 订单支付成功通知
  orderPaySuccess: {
    template_id: 'sptBiyEVlnmf6kMqHdKWZY9coHUbzN294ylNFbkeg1g',
  },
}
const base = {
  autoSendTemplate: function (dataOptions) {
    var url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+globalData.appid+'&secret='+globalData.secret+''
    https.get(url, (res)=> {
      var datas = [];
      var size = 0;
      res.on('data', function (data) {
       datas.push(data);
       size += data.length;
     });
     res.on("end", function () {
       console.log(dataOptions)
        var buff = Buffer.concat(datas, size);
        var result = iconv.decode(buff, "utf8");
        var access_token = JSON.parse(result).access_token;
        var postData = JSON.stringify({
          // access_token: body.access_token,
          touser : dataOptions.touser,
          template_id : 'sptBiyEVlnmf6kMqHdKWZY9coHUbzN294ylNFbkeg1g',
          page : dataOptions.page,
          form_id : dataOptions.form_id,
          data : dataOptions.data
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
            console.log(dd);
          })
          res.on('error', err => {
            console.log(err);
          });
        });
        req.write(postData);
        req.end();
      });
    })
  },
  phoneModel: (req) => {
    var ua = req.headers['user-agent'],
        $ = {},
        phoneType = '';
    if (/mobile/i.test(ua)){
      $.Mobile = true;
    }
    if (/like Mac OS X/.test(ua)) {
        $.iOS = /CPU( iPhone)? OS ([0-9\._]+) like Mac OS X/.exec(ua)[2].replace(/_/g, '.');
        $.iPhone = /iPhone/.test(ua);
        $.iPad = /iPad/.test(ua);
    }
    if (/Android/.test(ua)){
      $.Android = /Android ([0-9\.]+)[\);]/.exec(ua)[1];
    }

    if (/webOS\//.test(ua)){
      $.webOS = /webOS\/([0-9\.]+)[\);]/.exec(ua)[1];
    }

    if (/(Intel|PPC) Mac OS X/.test(ua)){
      $.Mac = /(Intel|PPC) Mac OS X ?([0-9\._]*)[\)\;]/.exec(ua)[2].replace(/_/g, '.') || true;
    }
    if (/Windows NT/.test(ua)){
      $.Windows = /Windows NT ([0-9\._]+)[\);]/.exec(ua)[1];
    }

    if ($.iPhone || $.iPad) {
      phoneType = 'ios'
    } else if ($.Android){
      phoneType = 'android';
    } else{
      phoneType = 'other';
    }
    return phoneType;
  },
  getUrlParam: (name)=> {
    return (name.split('?')[1]).substring(3);
  },
  CouponNum: (v)=> {
    const index = v.indexOf('减');
    const result = parseInt(v.substr(index + 1,v.length));
    return result;
  },
  // // 根据识别码查询用户信息
  Distinguish: (token, cb)=> {
    if (token == undefined || token == null || token == '') {
      token = "undefined"
    }
    mongodb.find('userList', {"token": token}, (err, msg) => {
      if (err) {
        return err
      } else {
        cb(msg)
      }
    });
  },
}


module.exports = base;
