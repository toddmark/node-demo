var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'sakila',
  insecureAuth: true
});

connection.connect();

connection.query('SELECT first_name, last_name FROM actor_info LIMIT 10', function (error, results, fields) {
  if (error) throw error;
  console.table(results);
});

connection.end();
