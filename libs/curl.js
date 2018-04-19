/**
 * Created by linyang on 17/3/7.
 */
let request = require('request');
let config = require('../conf/config');

/**
 * 发送http请求.
 * @param args {array}
 * @param callback {function}
 */
exports.send = function (args, callback) {
    request(args, function (err, res, body) {
        if (err) {
            callback(err, err);
        } else if (res.statusCode != 200) {
            callback('err', res.statusCode);
        } else {
            callback(null, body);
        }
    });
};