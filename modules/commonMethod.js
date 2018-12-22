const https = require("https");
const iconv = require("iconv-lite");
var request = require('request');
const mongodb = require('../mongodb.js');
var MyMethod = {
  // 获取商品id
  dismantlID: async (url, cb)=> {
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
       var id = result.substring(result.indexOf("https://a.m.taobao.com/i")+1,result.indexOf('.htm?')).replace(/[^0-9]/ig,"");;
       if(cb) {
         cb(id);
       }
      });
    });
  },
  getNowFormatDate: ()=> {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    //前十分钟时间
    var minutes=parseInt("20");
    var   interTimes=minutes*60*1000;

    var interTimes=parseInt(interTimes);
    date = new Date(Date.parse(date) - interTimes);
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
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
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
            + " " + hour + seperator2 + minutes
            + seperator2 + date.getSeconds();
    return currentdate;
  },
  get_order_details: ()=> {
    request({
      url: 'http://gateway.kouss.com/tbpub/orderGet',
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json",
      },
      body: {
        "fields":"tb_trade_parent_id,tk_status,tb_trade_id,num_iid,item_title,item_num,price,pay_price,seller_nick,seller_shop_title,commission,commission_rate,unid,create_time,earning_time,tk3rd_pub_id,tk3rd_site_id,tk3rd_adzone_id,relation_id",
        "start_time": MyMethod.getNowFormatDate(),
        // "start_time": '2018-12-12 00:00:00',
        "span":1200,
        "page_size":100,
        "tk_status":1,
        "order_query_type":"create_time",
        "session":"70000100c4844973c1cbd9e8b39753c9a39d169872f88da0dfec9dd80ee41f004cd5f881746586102"
      }
    }, function(error, response, body) {
      console.log(body)
      if (!error && response.statusCode == 200) {
        if (body.tbk_sc_order_get_response) {
          var order_list = body.tbk_sc_order_get_response.results.n_tbk_order;
          if(order_list){
            for (var i = 0; i < order_list.length; i++) {
              mongodb.updateMany('order_details', {trade_id:order_list[i].trade_id}, order_list[i],(err, response)=>{
              });
            }
          }
          setInterval(()=> {
            MyMethod.get_order_details();
          },600000);
          return false;
        }
      }else {
        setInterval(()=> {
          MyMethod.get_order_details();
        },600000);
        return false;
      }
    });
  }
}
module.exports = MyMethod;
