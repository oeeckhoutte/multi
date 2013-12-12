/* global exports */

/**
 * @module server/messages
 * @private
 */

var util = require('util');
var PubSub = require('../shared/PubSub');

/**
 * @classdesc Centralized communication infrastructure for one session.
 * Every session or player can send messages to connected clients
 * and subscribe to messages, using a custom filter.
 * @class
 * @private
 * @param io ready to use socket.io instance
 * @param {string} token  session token of the using session
 */
exports.MessageBus = function (io, token) {
	this.io = io;
	this.token = token;
	this.pubSub = new PubSub();
};

/**
 * Adds the given socket to the centralized communication infrastructure.
 * Disconnects are handled by sending a last message with the 
 * name 'disconnect' and the id of the affected player. After that all
 * listeners will be removed from this socket.
 * @param {} socket socket.io socket of a new player 
 */
exports.MessageBus.prototype.addSocket = function (socket) {
	var messageBus = this;
	socket.join(this.token);
	socket.on('disconnect', function () {
		messageBus.pubSub.publish({
			name: 'disconnect',
			fromInstance: socket.id
		});
		socket.removeAllListeners();
	});
	socket.on('multi', function (data) {
		messageBus.onSocketMessage(data, socket);
	});
};

/**
 * Relayse the given message to all interested clients. This method is kind
 * of a filter to avoid unnecessary network traffic. To decide which client
 * is interested in a message, its 'toClient' field is used. Server messages
 * are send to all clients by default (when no valid toClient field is 
 * provided).
 * @param  {object} message  message object to distribute to the clients
 * @param  socket  socket that received this message originally or null
 */
exports.MessageBus.prototype.distribute = function (message, socket) {
	var toClient = message.toClient;
	if (toClient === 'all-but-myself' && socket) {
		// send to all but sender
		socket.broadcast.to(this.token).emit('multi', message);
	} else if (util.isArray(toClient)) {
		// send to all ids in array
		var sockets = this.io.sockets.in(this.token).sockets;
		for (var i in toClient) {
			var id = toClient[i];
			if (sockets.hasOwnProperty(id)) {
				sockets[id].emit('multi', message);
			}
		}
	} else if (toClient === 'all' || socket === null) {
		// send to all - default on server
		this.io.sockets.in(this.token).emit('multi', message);
	}
};

/**
 * The given socket send a message - publish it to all subscribers and 
 * relay to interested clients.
 * @private
 */
exports.MessageBus.prototype.onSocketMessage = function (message, socket) {
	this.distribute(message, socket);
	this.pubSub.publish(message);
};

/**
 * Sends the given message to the instance of the sender (fromInstance) on 
 * all clients by default. <br><br>
 * You can set message.toClient to: <br>
 * <ul>
 * <li>'all' - default behaviour </li>
 * <li>['id1', 'id2'] - message will be send to all clients whose IDs are 
 * inside the array </li>
 * </ul>
 * Use this option to save bandwidth.
 * 
 * @param  {object} message
 * @example
 * messageBus.send({
 *   name: 'myEvent',
 *   fromInstance: 'playerXYZ',
 *   toClient: [player1.id, player2.id],
 *   data1: 'mydata',
 *   data2: 42
 * });
 */
exports.MessageBus.prototype.send = function (message) {
	this.distribute(message, null);
};

/**
 * Register a callback for messages from any client.
 * @param  {string}   messageName  on which message name you would like to register?
 * @param  {string}   instance     messages from which instance do interest you?
 * @param  {Function} callback     function to call when a corresponding message
 *  is received (message name _and_ instance correspond to arguments)
 * @return {}                      token to unregister this callback again
 */
exports.MessageBus.prototype.register = function (messageName, instance, callback) {
	return this.pubSub.subscribe(callback, function (message) {
		return instance === message.fromInstance && messageName === message.name;
	});
};

/**
 * Unrigister a callback you registered earlier.
 * @param  {} token  register token returned by 'register' method
 * @example
 * // register
 * token = messageBus.register('myEventName', myId, callback);
 * // ... do something ...
 * // unregister again
 * messageBus.unregister(token);
 */
exports.MessageBus.prototype.unregister = function (token) {
	this.pubSub.unsubscribe(token);
};

/**
 * Unregister all callbacks from this MessageBus instance.
 */
exports.MessageBus.prototype.unregisterAll = function () {
	this.pubSub.unsubscribeAll();
};