TopClient = require('./taobao/lib/api/topClient.js').TopClient;

let client = new TopClient({
	'appkey': '25258142',
	'appsecret': 'a6c3bb69003762589b8605185263ae3e',
	'REST_URL': 'http://gw.api.tbsandbox.com/router/rest'
});

module.exports = client;
