1. 拼写错误问题
2. socket io 版本报错问题
3. socket.emit 作用
```js
  Chat.prototype.sendMessage = function (room, text) {
  var message = {
    room: room,
    text: text
  }
  // what is doing this follow?
  this.socket.emit('message', message);
}
```
4. usersInRoomSummary 变量位置问题导致undefined出现在客户端中
