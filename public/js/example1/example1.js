
requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], 
		function (multiModule, socketio) {


	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};

	var multi = multiModule.init(multiOptions);
	multi.on('joiningSessionStarted', function (event) {
		$('.sessionstart').hide();
	});
	multi.autoJoinSession();

	function showPlayer(player) {
		var p = $('<li></li>', {'class': player.id}).text(player.id);
		$('.players').append(p);
		player.on('disconnected', function (event) {
			p.remove();
		});
	}

	function handleSession(session, message) {
		$('.session').text(message + ' session ' + session.token);
		$('.myself').text(session.myself.id);

		for (var i in session.players) {
			showPlayer(session.players[i]);
		}

		session.on('playerJoined', function (event) {
			showPlayer(event.player);
		});
		session.on('destroyed', function () {
			$('.session').text('destroyed');
			$('.myself').text('');
			$('.players').empty();
		});
	}

	multi.on('sessionCreated', function (event) {
		handleSession(event.session, 'created');
	});

	multi.on('sessionJoined', function (event) {
		handleSession(event.session, 'joined');
	});

	$('.sessionstart .new').click(function(event) {
		$('.sessionstart').hide();
		multi.createSession();
	});
	$('.sessionstart .join').click(function(event) {
		var token = $('.sessionstart .token').val();
		multi.joinSession(token);
	});

});