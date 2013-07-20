function CallbackQueue() {
	this.queue = [];
}
CallbackQueue.prototype.register = function register(callback) {
	if (callback) {
		this.queue.push(callback);
	}
};
CallbackQueue.prototype.unregister = function unregister(callback) {
	var index = this.queue.indexOf(callback);

	if (index > -1) {
		this.queue.splice(index, 1);
	}
}
CallbackQueue.prototype.call = function call() {
	for (var i = 0, callback ; callback = this.queue[i] ; i++) {
		callback.apply(null, arguments);
	}
};
CallbackQueue.prototype.each = function each(func) {
	for (var i = 0, callback ; callback = this.queue[i] ; i++) {
		var result = func(callback);
		if (typeof result != "undefined") {
			return result;
		}
	}
};

function Bound(_this, func) {
	return function BoundFunction() {
		return func.apply(_this, arguments);
	}
}

boundingBox = (function initBoxProto() {
	var box = function (copyFrom) {
		this.left = 0;
		this.right = 0;
		this.top = 0;
		this.bottom = 0;
		if (copyFrom) {
			this.left = copyFrom.left;
			this.right = copyFrom.right;
			this.top = copyFrom.top;
			this.bottom = copyFrom.bottom;
		};
	};
	box.prototype.width = function () {
		return this.right - this.left;
	};
	box.prototype.height = function () {
		return this.top - this.bottom;
	};
	box.prototype.middleVertical = function () {
		return (this.left + this.right) / 2.;
	};
	box.prototype.middleHorizontal = function () {
		return (this.top + this.bottom) / 2.;
	};
	box.prototype.contains = function (x, y) {
		if (!y && typeof y == "undefined") {
			y = x.y;
			x = x.x;
		}

		return (this.left <= x) &&
			   (x <= this.right) &&
			   (this.top <= y) &&
			   (y <= this.bottom);
	};

	return box;
})();

$.prototype.boundingBox = function () {
	var offset = new boundingBox(this.offset());

	offset.right = offset.left + this.outerWidth();
	offset.bottom = offset.top + this.outerHeight();

	return offset;
};
$.prototype.boundingBoxes = function () {
	return this.toArray().map(function (e) {
		return $(e).boundingBox();
	});
};
