const mysql = require('mysql');

module.exports.createDbPool = function (mySqlInfo) {
    return mysql.createPool({
        connectionLimit: 100,
        host: mySqlInfo.host,
        user: mySqlInfo.user,
        password: mySqlInfo.password,
        database: mySqlInfo.database
    });
};

module.exports.isGroup = function (msg) {
  return msg.chat.type === "group" || msg.chat.type === "supergroup";

};

module.exports.isPrivate = function (msg) {
  return msg.chat.type === "private";
};
