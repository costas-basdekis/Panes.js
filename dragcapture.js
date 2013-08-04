$(function () {
	DragCapture.init();
})

DragCapture = {
	_dragging: false,
	_dragParameters: null,
	init: function() {
		this._onMouseDown = Bound(this, this._onMouseDown);
		this._onMouseMove = Bound(this, this._onMouseMove);
		this._onMouseUp   = Bound(this, this._onMouseUp);
		this._onKeyDown   = Bound(this, this._onKeyDown);
		this._onKeyUp     = Bound(this, this._onKeyUp);
		$(document).on("mousedown", this._onMouseDown);
	},
	onDragStart: new CallbackQueue(), //Return an object to start dragging
	_cancelEvent: function () {
		return false;
	},
	_findHanlder: function (target, mouse) {
		var acceptParameters = {
			onDragMove: null,
			onDragEnd: null,
			dragExtra: null,
		};

		return this.onDragStart.each(function (callback){
			if (callback(target, mouse, acceptParameters)) {
				return acceptParameters;
			}
		});
	},
	_onMouseDown: function (e) {
	    if (e == null) {
	    	e = window.event; 
	    }

	    if (this._dragging) {
	    	return;
	    }

	    //IE, left click == 1
	    //Firefox, left click == 0
	    if (!(e.button == 1 && window.event != null) &&
	        !(e.button == 0)) {
	    	return true;
	    }

	    //Find a hook function to start handling
	    var target = $(e.target != null ? e.target : e.srcElement);
	    var mouse = {x: e.clientX, y: e.clientY};
	    var acceptParameters = this._findHanlder(target, mouse);

	    if (!acceptParameters) {
	    	return;
	    }

	    this._dragging = true;

		this._dragParameters = acceptParameters;
		this._dragParameters.mouseStart = mouse;
		this._dragParameters.mousePrev = mouse;
		this._dragParameters.target = target;

		$(document).on("mousemove", this._onMouseMove)
			.on("mouseup", this._onMouseUp)
			.on("selectstart", this._cancelEvent)
			.on("keydown", this._onKeyDown)
			.on("keyup", this._onKeyUp);
	    
	    //Prevent text selection and image dragging
	    document.body.focus();
	    target.bind("dragstart", this._cancelEvent);
	    return false;
	},
	_onMouseMove: function (e) {
	    if (e == null) {
	        e = window.event;
	    }

	    if (!this._dragging) {
	    	return;
	    }

	    var mouse = {x: e.clientX, y: e.clientY};
	    var mouseOffset = {x: e.clientX - this._dragParameters.mouseStart.x,
						   y: e.clientY - this._dragParameters.mouseStart.y};
	    var mouseDelta = {x: e.clientX - this._dragParameters.mousePrev.x,
						  y: e.clientY - this._dragParameters.mousePrev.y};
	    if (this._dragParameters.onDragMove) {
	    	var stopDrag = this._dragParameters.onDragMove(
	    		this._dragParameters.dragExtra, mouse, mouseOffset, mouseDelta);

	    	if (stopDrag == false) {
	    		this._onMouseUp();
	    	}
	    }
		this._dragParameters.mousePrev = mouse;
	},
	_onMouseUp: function () {
		if (!this._dragging) {
			return;
		}

        // we're done with these events until the next OnMouseDown
        $(document).off("mousemove", this._onMouseMove)
        		   .off("mouseup", this._onMouseUp)
        		   .off("selectstart", this._cancelEvent);
        if (this._dragParameters.dragTarget) {
        	this._dragParameters.dragTarget.unbind("dragstart", this._cancelEvent);
        }

        if (this._dragParameters.onDragEnd) {
        	this._dragParameters.onDragEnd(this._dragParameters.dragExtra);
        }

        this._dragging = false;
        this._dragParameters = null;
	},
	_onKeyDown: function (e) {
	    if (e == null) {
	        e = window.event;
	    }

		if (!this._dragging) {
			return;
		}

	    var mouseOffset = {x: e.clientX - this._dragParameters.mousePrev.x,
						   y: e.clientY - this._dragParameters.mousePrev.y};
		if (this._dragParameters.onKeyDown) {
			this._dragParameters.onKeyDown(
				this._dragParameters.dragExtra, e.which,
				this._dragParameters.mousePrev, mouseOffset);
		}
	},
	_onKeyUp: function (e) {
	    if (e == null) {
	        e = window.event;
	    }

		if (!this._dragging) {
			return;
		}

	    var mouseOffset = {x: e.clientX - this._dragParameters.mousePrev.x,
						   y: e.clientY - this._dragParameters.mousePrev.y};
		if (this._dragParameters.onKeyUp) {
			this._dragParameters.onKeyUp(
				this._dragParameters.dragExtra, e.which,
				this._dragParameters.mousePrev, mouseOffset);
		}
	},
}
