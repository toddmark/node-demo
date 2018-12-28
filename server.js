var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

// 404 响应
function send404(response) {
  response.writeHead(404, {'content-Type': 'text/html'});
  response.write('<h1>Error 404: resource not found</h1>');
  response.end();
}

// 提供文件数据服务
function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {'content-Type': mime.getType(path.basename(filePath))});
  response.end(fileContents);
}

// 缓存服务
function serveStatic(response, cache, absPath) {
  if (false && cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists) {
      if (exists) {
        fs.readFile(absPath, function(err, data) {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        })
      } else {
        send404(response);
      }
    })
  }
}

var server = http.createServer(function(request, response) {
  var filePath = false;
  if (request.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }
  var absPath = './' + filePath;
  serveStatic(response, cache, absPath);
})

server.listen(6661, function() {
  console.log('server listen');
})
