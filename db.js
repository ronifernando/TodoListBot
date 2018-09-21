const common = require('./method.js');

module.exports.createTodo = function (db, todoid, todousername, tododate, todotitle, tododesc) {
  let time = new Date(tododate);

  db.query("INSERT IGNORE INTO todolist SET ?", {todoid:todoid, todousername:todousername, tododate:tododate, todotitle:todotitle, tododesc:tododesc},
      (error, results, fields) => {
          if (error) return -1;
      });
  return 0;
};

module.exports.getTodoList = function (db, callback) {
  db.query("SELECT * FROM todolist ORDER BY todoid DESC", (error, result, fields) => {
      if (error) {
          console.log("Error retrieving list, returning empty array");
          return callback(new Array(0));
      }
      return callback(result);
  });
};

module.exports.getMyTodoList = function (db, msgid, callback) {
  db.query("SELECT * FROM todolist WHERE todoid = ?", [msgid], (error, result, fields) => {
      if (error) {
          console.log("Error retrieving list, returning empty array");
          return callback(new Array(0));
      }
      return callback(result);
  });
};

module.exports.getMyTodoDetail = function (db, msgid, mdate, callback) {
    db.query("SELECT * FROM todolist WHERE todoid = ? AND DATE(tododate) = ?", [msgid, mdate], (error, result, fields) => {
        if (error) {
            console.log("Error retrieving list, returning empty array");
            return callback(new Array(0));
        }
        return callback(result);
    });
  };