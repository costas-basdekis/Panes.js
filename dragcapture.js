$(function () {
	DragCapture.init();
})

DragCapture = {
	_dragExtra: null,
	_dragTarget: null,
	_dragMouseStart: null,
	_dragMousePrev: null,
	init: function() {
		this._onMouseDown = Bound(this, this._onMouseDown);
		this._onMouseMove = Bound(this, this._onMouseMove);
		this._onMouseUp   = Bound(this, this._onMouseUp);
		$(document).on("mousedown", this._onMouseDown);
	},
	onDragStart: new CallbackQueue(), //Return an object to start dragging
	_onDragMove: null,
	_onDragEnd: null,
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

	    this._onDragMove = acceptParameters.onDragMove;
	    this._onDragEnd = acceptParameters.onDragEnd;
	    this._dragExtra = acceptParameters.dragExtra;

	    this._dragTarget = target;
		this._dragMouseStart = mouse;
		this._dragMousePrev = mouse;

	    $(document).on("mousemove", this, this._onMouseMove)
	    		   .on("mouseup", this, this._onMouseUp)
	    		   .on("selectstart", this._cancelEvent);
	    
	    //Prevent text selection and image dragging
	    document.body.focus();
	    target.bind("dragstart", this._cancelEvent);
	    return false;
	},
	_onMouseMove: function (e) {
	    if (e == null) {
	        e = window.event;
	    }

	    var mouse = {x: e.clientX, y: e.clientY};
	    var mouseOffset = {x: e.clientX - this._dragMouseStart.x,
						   y: e.clientY - this._dragMouseStart.y};
	    var mouseDelta = {x: e.clientX - this._dragMousePrev.x,
						  y: e.clientY - this._dragMousePrev.y};
	    if (this._onDragMove) {
	    	var stopDrag = this._onDragMove(this._dragExtra, mouse, mouseOffset, mouseDelta);

	    	if (stopDrag == false) {
	    		this._onMouseUp();
	    	}
	    }
		this._dragMousePrev = mouse;
	},
	_onMouseUp: function () {
        // we're done with these events until the next OnMouseDown
        $(document).off("mousemove", this._onMouseMove)
        		   .off("mouseup", this._onMouseUp)
        		   .off("selectstart", this._cancelEvent);
        this._dragTarget.unbind("dragstart", this._cancelEvent);

        if (this._onDragEnd) {
        	this._onDragEnd(this._dragExtra);
        }

        this._dragExtra = null;
        this._dragTarget = null;
		this._dragMousePrev = null;
	}
}
