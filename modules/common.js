var MyMethod = {
  // 获取id
  Obtain: (url) => {
    let item_id = '';
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
      item_id = id;
      });
    });
    return item_id;
  }
}
