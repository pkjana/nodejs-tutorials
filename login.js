var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const router = express.Router();

var formidable = require('formidable');
var fs = require('fs');

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'nodelogindb'
});

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			console.log(results);
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				request.session.userimage = results[0].image;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.writeHead(200, {'Content-Type': 'text/html'});
		response.write('<img src="/images/nodejs-logo.png" alt="nodejs logo">');
		response.write('<b>Welcome, ' + request.session.username + '!</b>');
		response.write('<img src=/users_image/'+request.session.userimage+'>');			
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

app.get('/init-image-upload', function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
  response.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
  response.write('<input type="file" name="filetoupload"><br>');
  response.write('<input type="submit">');
  response.write('</form>');
  return response.end();
	});
	
app.post('/fileupload', function(request, response) {
	if (request.url == '/fileupload') {
    var form = new formidable.IncomingForm();
    form.parse(request, function (err, fields, files) {
      var oldpath = files.filetoupload.path;
      var newpath = 'C:/Users/ejanpab/Desktop/nodelogin/public/users_image/' + files.filetoupload.name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        response.write('File uploaded and moved!');
        //response.end();
      });
	  	if (files.filetoupload.name) {
			var sql = "UPDATE accounts SET image ='"+files.filetoupload.name+"' WHERE username='"+request.session.username+"'";
			console.log(sql);
		connection.query(sql, function(error, results, fields) {
			console.log(results);
			if (results) {				
				response.write('image name to db!');
			}			
			response.end();
		});
	}
	});
	}
});
app.listen(3000);