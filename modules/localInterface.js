const mongodb = require('../mongodb.js');
const ObjectId = require('mongodb').ObjectId;
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
}
