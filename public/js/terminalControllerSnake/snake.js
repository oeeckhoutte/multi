/* jshint camelcase: false */
/*
The snake object
*/

define(function () {

	var START_X = 0;
	var START_Y = 0;

	var Snake = function (jaws, tileSize, fieldWidth, fieldHeight) {
		this.tileSize = tileSize;
		this.halfTileSize = tileSize/2;
		this.fieldWidth = fieldWidth;
		this.fieldHeight = fieldHeight;
		this.jaws = jaws;
		this.headAnim = null;
		this.tailAnim = null;
		this.head = null;
		this.tail = new jaws.SpriteList();
		this.direction = 1;
		this.newDirection = 1;
		this.expired = 0;
		this.fps = 1/2 * 1000; // speed in fps * 1000
		this.segmetsToAdd = 0;
	};

	Snake.prototype.setDirection = function (direction) {
		this.newDirection = direction;
	};

	Snake.prototype.getNewTailElement = function (prev) {
		var tailElement = new this.jaws.Sprite({ x: prev.x, y: prev.y, anchor: 'center' });
		tailElement.setImage(this.tailAnim.next());
		tailElement.prev = prev;
		this.tail.push(tailElement);
		return tailElement;
	};

	Snake.prototype.setup = function () {
		var snakeAnim = new this.jaws.Animation({
			sprite_sheet: '../../img/snake.png',
			frame_size: [20, 20],
			frame_duration: 500});

		var x = START_X + this.halfTileSize;
		var y = START_Y + this.halfTileSize;
		this.tailAnim = snakeAnim.slice(0, 1);
		this.headAnim = snakeAnim.slice(1, 3);
		this.head = new this.jaws.Sprite({ x: x, y: y, anchor: 'center' });
		this.head.setImage(this.headAnim.next());
		this.head.isFree = false;
		this.tail.push(this.head);
		var prev = this.head;
		for (var i = 0; i < 10; i++) {
			var tailElement = this.getNewTailElement(prev);
			prev = tailElement;
		}
	};

	Snake.prototype.eatPoints = function (number) {
		this.segmetsToAdd += number;
		this.fps *= Math.pow(0.9, number);
	}

	// which direction?
	Snake.prototype.updateDirection = function () {
		this.head.isFree = true;
		var oppositeDir = (this.newDirection + 2) % 4;
		if (this.direction !== oppositeDir) {
			this.direction = this.newDirection;
		}
		switch (this.direction) {
			case 0: // up
				this.head.y -= this.tileSize;
				this.head.rotateTo(-90);
				break;
			case 1: // right
				this.head.x += this.tileSize;
				this.head.rotateTo(0);
				break;
			case 2: // down
				this.head.y += this.tileSize;
				this.head.rotateTo(90);
				break;
			case 3: // left
				this.head.x -= this.tileSize;
				this.head.rotateTo(180);
				break;
			default:
				break;
		}
	};

	// don't leave the canvas
	Snake.prototype.checkBoundaries = function () {
		if (this.head.x < this.halfTileSize) {
			this.head.x = this.fieldWidth - this.halfTileSize;
		}
		if (this.head.y < this.halfTileSize) {
			this.head.y = this.fieldHeight - this.halfTileSize;
		}
		if (this.head.x > this.fieldWidth) {
			this.head.x = this.halfTileSize;
		}
		if (this.head.y > this.fieldHeight) {
			this.head.y = this.halfTileSize;
		}
	};

	// update tail to move behind head
	Snake.prototype.moveTail = function () {
		var lastIndex = this.tail.length-1;
		// add new segment if needed
		if (this.segmetsToAdd > 0) {
			this.getNewTailElement(this.tail.at(lastIndex));
			this.segmetsToAdd--;
		}
		// move
		for (var i = lastIndex; i > 0; i--) {
			var ele = this.tail.at(i);
			ele.setImage(this.tailAnim.next());
			ele.x = ele.prev.x;
			ele.y = ele.prev.y;
		}
	};

	// called once per snake tick
	// so snakes can have different speed values
	Snake.prototype.tick = function () {
		this.moveTail();
		this.updateDirection();
		this.checkBoundaries();
	};

	// called according to global framerate
	Snake.prototype.update = function () {
		this.head.setImage(this.headAnim.next());

		this.expired += this.jaws.game_loop.tick_duration;
		if (this.expired >= this.fps) {
			this.expired = 0;
			this.tick();
		}
	};

	// is the snake biting itself?
	Snake.prototype.isDead = function () {
		var collisions = this.jaws.collideOneWithMany(this.head, this.tail);
		return collisions.length > 0 && this.head.isFree;
	};

	Snake.prototype.draw = function () {
		this.tail.draw();
		this.head.draw();
	};

	return Snake;

});