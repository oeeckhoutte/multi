var multiModule = require('../multi/server');


exports.Game = function (session) {

	function onPlayerAdded(event) {
		event.player.attributes.color = multiModule.color.random();
	}

	session.on('playerAdded', onPlayerAdded);

};