const https = require("https");
const iconv = require("iconv-lite");
var request = require('request');
const mongodb = require('../mongodb.js');
const base = require('../common');
var MyMethod = {
    days: function(month){
    var days;
    if (month == 2) {
        days = year % 4 == 0 ? 29 : 28;
    }
    else if (month == 1 || month == 3 || month == 5 || month == 7 || month == 8 || month == 10 || month == 12) {
        //月份为：1,3,5,7,8,10,12 时，为大月.则天数为31；
        days = 31;
    }
    else {
        //其他月份，天数为：30.
        days = 30;
    }
    return days;
  },
  // 获取商品id
  dismantlID: async (url, cb)=> {
    console.log(url);
    let item_id = '';
    await https.get(url, (res)=> {
      var datas = [];
      var size = 0;
      res.on('data', function (data) {
       datas.push(data);
       size += data.length;
     });
     res.on("end", function () {
       var buff = Buffer.concat(datas, size);
       var result = iconv.decode(buff, "utf8");//转码//var result = buff.toString();//不需要转编码,直接tostring
       console.log(result)
       var id;
       if (result.indexOf("https://a.m.taobao.com/i") != -1) {
         id = result.substring(result.indexOf("https://a.m.taobao.com/i")+1,result.indexOf('.htm?')).replace(/[^0-9]/ig,"");
       }else if (result.indexOf("https://detail.m.tmall.com/item.htm?id=") != -1){
         id = result.substring(result.indexOf("https://detail.m.tmall.com/item.htm?id=")+1,result.indexOf('&')).replace(/[^0-9]/ig,"");
       } else if (result.indexOf("&id=") != -1){
         id = result.substring(result.indexOf("&id=")+1,result.indexOf('&sourceType')).replace(/[^0-9]/ig,"");
       }
       if(cb) {
         cb(id);
       }
      });
    });
  },
  getNowFormatDate: (num)=> {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    //前十分钟时间
    var minutes=parseInt(num);
    var   interTimes=minutes*60*1000;

    var interTimes=parseInt(interTimes);
    date = new Date(Date.parse(date) - interTimes);
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    var Second = date.getSeconds();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    if (hour >= 0 && hour <= 9) {
            hour = "0" + hour;
    }
    if (minutes >= 0 && minutes <= 9) {
            minutes = "0" + minutes;
    }
    if (Second >= 0 && Second <= 9) {
        Second = "0" + Second;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + hour + seperator2 + minutes
            + seperator2 + Second;
    return currentdate;
  },
  get_order_details: async (time, order_query_type, cb)=> {
    var start_time = time ? time : await MyMethod.getNowFormatDate(20);
    console.log(start_time)
    await request({
      url: 'http://gateway.kouss.com/tbpub/orderGet',
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: {
        "fields":"tb_trade_parent_id,tk_status,tb_trade_id,num_iid,item_title,item_num,price,pay_price,seller_nick,seller_shop_title,commission,commission_rate,unid,create_time,earning_time,tk3rd_pub_id,tk3rd_site_id,tk3rd_adzone_id,relation_id",
        "start_time": start_time,
        // "start_time": '2018-12-23 23:07:00',
        "span":1200,
        "page_size":100,
        "tk_status":1,
        "order_query_type": order_query_type,
        "session":"700001003414d0f3981bbb095e98d983e61dbff086afb6e9be10f1cbe2eaef3de83e9951746586102"
      }
    }, function(error, response, body) {
      console.log(body);
      if (!error && response.statusCode == 200) {
        if (body.tbk_sc_order_get_response) {
          var order_list = body.tbk_sc_order_get_response.results.n_tbk_order;
          if(order_list){
            for (var i = 0; i < order_list.length; i++) {
              mongodb.updateMany('order_details', {trade_id:order_list[i].trade_id}, order_list[i],(err, _msg)=>{
                if (order_list[i-1].tk_status == 12) {
                  var adzone_id = order_list[i-1].adzone_id;
                  mongodb.find('weChatUsers',{"pid":adzone_id}, (err1,_msg1)=> {
                    var wechatUserInfo = _msg1[0];
                    if (JSON.stringify(_msg1) == '[]') {
                      return false;
                    }
                    base.autoSendTemplate({
                      touser: wechatUserInfo.openid,
                      page: 'pages/YoCoupons/index',
                      form_id: wechatUserInfo.form_id,
                      data: {
                        keyword1: {
                          value: order_list[i-1].item_title,
                        },
                        keyword2: {
                          value: order_list[i-1].trade_id
                        },
                        keyword3: {
                          value: order_list[i-1].create_time,
                        },
                        keyword4: {
                          value: order_list[i-1].alipay_total_price
                        },
                        keyword5: {
                          value: '添加客服微信（XiaoHuanYouQuan）,确认收货后还可以获得返现哦~'
                        }
                      }
                    })
                  })
                }
                if (_msg.result.nModified == 1) {
                  var adzone_id = order_list[i-1].adzone_id;
                  var pub_share_pre_fee = order_list[i-1].pub_share_pre_fee;
                  if (order_list[i-1].tk_status === 3) {
                    mongodb.find('userList',{"pid":adzone_id}, (err1,_msg1)=> {
                      var amount = _msg1[0].estimated_revenue_the_month;
                      amount = (Number(amount) + Number(pub_share_pre_fee)).toFixed(2);
                      mongodb.update('userList',{"pid": adzone_id}, {"estimated_revenue_the_month": amount}, (err2, _msg2)=> {
                      })
                    })
                  }
                }
              });
            }
          }
        }
      }
    });
  },
  // 生成随机数
  randomNumber: function(n) {
    var chars = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
     var res = "";
     for(var i = 0; i < n ; i ++) {
         var id = Math.ceil(Math.random()*59);
         res += chars[id];
     }
     return res;
  },
}
module.exports = MyMethod;
