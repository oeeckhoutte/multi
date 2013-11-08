/*
Dumb game controller for the snake.
*/

define(function (require, exports, module) {

	exports.start = function (session, showSection) {

		function startGame() {
			showSection('#controller');
			session.once('finished', onFinished);
		}

		function onAgainClick(event) {
			// player wants to play again
			session.message('again');
			startGame();
		}

		function onExitClick(event) {
			// with one player bored the game is over
			window.close();
		}

		function onFinished() {
			// game is finished
			showSection('#controller-finished');
			$('#controller-finished .again').one('click', onAgainClick);
			$('#controller-finished .exit').one('click', onExitClick);
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			// means our presenter has disconnected - quit
			// TODO: nicer syntax like session.myself.disconnect()
			session.disconnectMyself();
		}

		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		startGame();

	};

});