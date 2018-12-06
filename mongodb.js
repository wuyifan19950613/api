// var MongoClient = require('mongodb').MongoClient;
// var url = 'mongodb://localhost:27017/test';
// MongoClient.connect(url, function (err, db) {
//     if (err) throw err;
//     let runoob = db.db('runoob')
//
// });
const common = {
  setName: 'shop',
  pageSize: 1,
}
function connectDB(cb) {
  this.settings  = {
    url: 'mongodb://127.0.0.1:27017/',
    MongoClient: require('mongodb').MongoClient,
  };
  this.settings.MongoClient.connect(this.settings.url,{useNewUrlParser:true},function(err, db){
    if (err) {
      console.log(err);
      return err;
    }
    console.log("连接success");
    cb(err, db);
  });
}


const base = {
  // 插入多条数据
  insertMany: (collectionName, data , cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      dbo.collection(collectionName).insertMany(data, (err, res)=> {
        if (err) throw err;
        console.log("插入成功，一共插入"+res.insertedCount+"条数据");
        cb(err, res);
        db.close();
      })
    });
  },
  // 插入一条数据
  insertOne: (collectionName, data , cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      dbo.collection(collectionName).insertOne(data, (err, res)=> {
        if (err) throw err;
        console.log("插入成功，一共插入"+res.insertedCount+"条数据");
        cb(err, res);
        db.close();
      })
    });
  },
  // 查询数据
  find: (collectionName, data , cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      dbo.collection(collectionName).find(data).toArray((err, res)=> {
        if (err) throw err;
        cb(err, res);
        db.close();
      })
    });
  },
  // 更新多条数据
  updateMany: (collectionName, condition, data , cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      console.log(data)
      const updateStr = {$set: data};
      dbo.collection(collectionName).update(condition, updateStr, {upsert: true, multi: true}, (err, res)=> {
        if (err) throw err;
        console.log(res.result.nModified + " 条文档被更新");
        cb(err, res);
        db.close();
      })
    });
  },
  // 删除数据
  deleteOne: (collectionName, data , cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      dbo.collection(collectionName).deleteOne(data, (err, res)=> {
        if (err) throw err;
        console.log("删除数据成功");
        cb(err, res);
        db.close();
      })
    });
  },
  // 获取数据并分页
  paging: (collectionName, cb) => {
    connectDB((err, db) => {
      const dbo = db.db(common.setName);
      dbo.collection(collectionName).find().limit(common.pageSize).toArray((err, res)=> {
        if (err) throw err;
        cb(err, res);
        db.close();
      });
    });
  },
}
module.exports = base;
