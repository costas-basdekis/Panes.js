
function numberAndRest(value) {
	var number = parseFloat(value);

	if (isNaN(number)) {
		return false;
	}

	var rest = "";
	if (value != number) {
		rest = value.toString().substr(number.toString().length);
	}

	return {
		number: number,
		rest: rest,
	};
}

Panes = {
	//This should be equal to .pane-transition duration
	transitionDuration: 350,
	init: function () {
		this.initDOM();
		this.initSizes();
		this.updateSizes();
	
		this.Dividers.init();
		this.Captions.init();
		this.ControlBoxes.init();
	},
	initDOM: function () {
		//Detach containers so that we don't redraw with each change
		var topLevelContainers = $(":not(.pane-contents) > .pane-container");
		var tlcPlaceholders = topLevelContainers.each(function(i, container) {
			$(container).after("<div class='pane-container-placeholder'></div>");
		}).next();

		//Remove space between panes
		$(".pane-container").contents().filter(function (i, element) {
			return element.nodeName == "#text" && $.trim(this.innerHTML) == '';
		}).remove();

		//Make pane
		$(".pane-pane").each(function (i, pane) {
			var paneData = Panes.Pane(pane);

			paneData.initDOM();
		});

		//Put dividers
		var dividerHTML = "<span class='pane-divider'></span>";
		$(".pane-pane").each(function(i, pane) {
			pane = $(pane);

			pane.after(dividerHTML);
		});
		$(".pane-container").each(function(i, container) {
			container = $(container);

			container.prepend(dividerHTML);
		})

		//Reattach containers and draw
		topLevelContainers.each(function (i, container) {
			var placeholder = tlcPlaceholders[i];
			$(placeholder).after(container).detach();
		})

		//Animate dividers on hover
		$(".pane-divider").addClass("pane-color-transition");
	
		//Enable transitions only after the page has loaded, and elements have
		//been sized
		setTimeout(function() {$(".pane-pane").addClass("pane-transition");}, Panes.transitionDuration);
	},
	initSizes: function () {
		//Initialize every pane to have equal size
		$(".pane-container").each(function (i, container) {
			container = $(container);
	
			var children = container.children(".pane-pane");
			if (!children.length) {
				return;
			}

			var isVertical = container.hasClass("pane-vertical");
			var size = 1. / children.length;

			children.each(function (i, pane) {
				pane.paneData.initSize(isVertical, size);
			});
		});
	},
	//Change the pane sizes to reflect the data
	updateSizes: function (containers) {
		if (typeof containers == "undefined") {
			containers = $(".pane-container");
		}
	
		containers.each(function (i, container, updateChildren) {
			container = $(container);
			var children = container.children(".pane-pane");
	
			var flexiblePanes = children.filter(function (i, pane) {
				return !pane.paneData.state.isStatic;
			});
			var staticPanes = children.filter(function (i, pane) {
				return pane.paneData.state.isStatic;
			});
			var isVertical = container.hasClass("pane-vertical");
			var metric = isVertical ? "width" : "height";
	
			//Find the total static size
			var totalstaticSize = staticPanes.toArray()
											 .reduce(function (total, pane) {
				return total + " + " + pane.paneData.state.staticSize;
			}, "0px");
	
			//Find the total flexible percentage
			var totalFlexibleSize = flexiblePanes.toArray()
												 .reduce(function (total, pane) {
				return total + pane.paneData.state.flexibleSize;
			}, 0.);
	
			//Put the flexibles calculated sizes
			if (updateChildren) {
				flexiblePanes = flexiblePanes.filter(updateChildren);
			}
			flexiblePanes.each(function (i, pane) {
				var paneData = pane.paneData;
				pane = $(pane);
				var size = paneData.state.flexibleSize;
	
				//Fallback for Safari < 6.0 and others that don't support calc
				pane.css(metric, (size / totalFlexibleSize * 100.) + "%");
				if (staticPanes.length > 0) {
					var newSize = "calc((100% - (" + totalstaticSize + ")) * " +
								  (size / totalFlexibleSize) + ")";
					//Fallback for Safari 6.0+
					pane.css(metric, "-webkit-" + newSize);
					pane.css(metric,              newSize);
				}
			});

			//Set static non-collapsed panes size
			if (updateChildren) {
				staticPanes = staticPanes.filter(updateChildren);
			}
			staticPanes.each(function (i, pane) {
				var paneData = pane.paneData;
				var $pane = $(pane);

				//if (!paneData.state.isCollapsed) {
					$pane.css(metric, paneData.state.staticSize);
				//}
			});
		});
	},
	toggleCollapsed: function (pane) {
		pane[0].paneData.toggleCollapsed();
	},
	initDrag: function () {
	},
	Pane: (function initPaneProto() {
		function Pane (element) {
			var $element = $(element).closest(".pane-pane");

			if (!$element.length) {
				return null;
			}
			element = $element[0];

			if (!element.paneData) {
				element.paneData = new paneData(element);
			}

			return element.paneData;
		};
		function paneData (element) {
			this.els = {
				pane: $(element),
			};
			this.state = {};
			
			this.update();
			this.loadOptions();
		};
		var proto = paneData.prototype;

		function sizeIsStatic (size) {
			var nar = numberAndRest(size);

			if (!nar) {
				return false;
			}

			if (!nar.rest) {
				return nar.number == 0;
			}

			return [
				//Absolute
				"px", "cm", "mm", "in", "pt", "pc",
				//Font relative
				"ex", "em", "rem", "ch",
				//Viewport relative
				"vh", "vw", "vmin", "vmax",
			].indexOf(nar.rest) != -1;
		};
		proto.update = function () {
			this.state.isInMiddle = this.els.pane.is(":not(:first-of-type):not(:last-of-type)");
		};
		proto.loadOptions = function () {
			try {
				this.options = JSON.parse(this.els.pane.attr("data-pane-options") || "{}");
			} catch(e) {
				this.options = {};
			}
	
			if (sizeIsStatic(this.options.fixedWidth)) {
				this.state.fixedWidth = this.options.fixedWidth;
			}
			if (sizeIsStatic(this.options.fixedHeight)) {
				this.state.fixedHeight = this.options.fixedHeight;
			}
		};
		proto.initDOM = function () {
			var options = this.options, state = this.state;

			var pane = this.els.pane;

			var margin = $("<div class='pane-margin'></div>");

			//Add caption
			state.hasCaption = !!options.caption;
			if (state.hasCaption) {
				pane.addClass("pane-has-caption");
				var captionText = options.caption.text;
				var caption = $("<div class='pane-caption pane-transition'\
									  title='" + captionText + "'></div>");
				caption.append("<div class='pane-caption-text'>" + captionText + "</div>");	
				margin.append(caption);

				//Add control box
				var controlBox = $("<div class='pane-control-box'></div>");
				controlBox.append("<span class='pane-control pane-control-minimize' title='Minimize'></div>");
				controlBox.append("<span class='pane-control pane-control-maximize' title='Maximize'></div>");
				controlBox.append("<span class='pane-control pane-control-restore' title='Restore'></div>");
				controlBox.append("<span class='pane-control pane-control-close' title='Close'></div>");

				caption.prepend(controlBox);
			}

			//Add contents
			var contents = $("<div class='pane-contents'></div>");
			contents.append(pane.contents());
			margin.append(contents);

			//Check for just a container pane
			var paneChildren = contents.children();
			state.hasContainer = paneChildren.length == 2 && paneChildren.hasClass("pane-container");
			if (state.hasContainer) {
				pane.addClass("pane-has-container");
			}

			pane.append(margin);

			this.els.margin = margin;
			this.els.caption = caption;
			this.els.contents = contents;
		};
		proto.initSize = function (isVertical, flexibleSize) {
			var options = this.options, state = this.state;

			if ('defaultFlexibleSize' in options) {
				state.flexibleSize = options.defaultFlexibleSize;
			} else {
				state.flexibleSize = flexibleSize;
			}
			state.staticSize = options['fixed' + (isVertical ? 'Width' : 'Height')];

			this.updateSize(isVertical);

			if (options.collapsed) {
				this.toggleCollapsed();
			}
		};
		proto.updateSize = function (isVertical) {
			var options = this.options, state = this.state;

			if (typeof isVertical != "undefined") {
				state.isVertical = isVertical;
			}
			state.metric = isVertical ? "width" : "height";

			var staticSize = state.isVertical ? state.fixedWidth : state.fixedHeight;
			state.isStatic = state.isCollapsed || !!staticSize;
			if (state.isStatic && !state.isCollapsed) {
				state.staticSize = staticSize;
			}
		};
		proto.toggleCollapsed = function () {
			var options = this.options, state = this.state;

			var pane = this.els.pane;
		
			//Toggle state
			state.isCollapsed = !state.isCollapsed;
			pane.toggleClass("pane-minimized", state.isCollapsed);
			this.updateSize();
		
			//Set size
			if (state.isCollapsed) {
				var captionHeight = this.els.caption.outerHeight();
		
				//Find the collapsed size by getting the caption height, plus the padding
				//due to surrounding dividers
				var dividerSize = parseInt(pane.siblings(".pane-divider").css(state.isVertical ? "width" : "height"));
				var staticSize = captionHeight + dividerSize / (state.isInMiddle ? 1. : 2.);
		
				//Rotate vertical captions
				if (state.isVertical) {
					this.els.caption.addClass("pane-caption-rotate");
				}
		
				state.staticSize = staticSize + "px";
				this.els.contents.fadeOut(this.transitionDuration);
			} else {
				//Unrotate vertical captions
				this.els.caption.removeClass("pane-caption-rotate");
		
				pane.css("height", "");
				this.els.contents.fadeIn(Panes.transitionDuration);
			}
		
			//Resize flexible panes
			Panes.updateSizes(pane.parent());
		};
		proto.float = function(toggle) {
			if (toggle) {
				this.floatOn();
			} else {
				this.floatOff();
			}
		};
		proto.floatOn = function() {
			var pane = this.els.pane;
			this.floatData = {
				pane: pane,
			}

			var paneOffset = pane.offset();
			//Subtract the body offset, because we will move the pane in
			//relation to the body
			var bodyOffset = $("body").offset();
			paneOffset.left -= bodyOffset.left;
			paneOffset.top -= bodyOffset.top;

			//Put placeholder in pane's position
			var panePlaceholder = $("<div class='pane-pane pane-placeholder'></div>");
			panePlaceholder.append("<div class='pane-margin'></div>");
			panePlaceholder.css("width", pane[0].style.width)
						   .css("height", pane[0].style.height);
			pane.css("width", pane.outerWidth())
				.css("height", pane.outerHeight());
			pane.after(panePlaceholder);
			pane.removeClass("pane-transition");
			var paneMarginBoundBox = $("> .pane-margin", pane).boundingBox();
			pane.css("left", paneMarginBoundBox.left)
				.css("top", paneMarginBoundBox.top)
				.css("width", paneMarginBoundBox.width())
				.css("height", paneMarginBoundBox.height());

			//So that we can move the placeholder around
			this.els.pane = panePlaceholder;
			panePlaceholder[0].paneData = this;

			//Create a bogus container to put the pane, so that we can move it around
			var bogusContainer = $("<div class='pane-container pane-bogus'/>");
			var isVertical = pane.parent().hasClass("pane-vertical");
			bogusContainer.toggleClass("pane-vertical", isVertical)
						  .toggleClass("pane-horizontal", !isVertical);
			bogusContainer.prependTo($("body"));

			//Put the pane in the bogus container
			bogusContainer.append(pane);

			this.floatData.paneOffset = paneOffset;
			this.floatData.panePlaceholder = panePlaceholder;
			this.floatData.bogusContainer = bogusContainer;
		};
		proto.floatOff = function() {
			var pane = this.floatData.pane;
			//Set the target back to pane, from placeholder
			this.els.pane = pane;
			var placeholder = this.floatData.panePlaceholder;

			var oldIsVertical = pane.parent().hasClass("pane-vertical");
			var newIsVertical = placeholder.parent().hasClass("pane-vertical");
			var changedOrientation = oldIsVertical != newIsVertical;

			placeholder.after(pane);

			//Discard the placeholder and bogus container
			placeholder.remove();
			this.floatData.bogusContainer.remove();

			//Remove size CSS and recalculate them
			pane.css("left", "")
				.css("top", "")
				.css("width", placeholder[0].style.width)
				.css("height", placeholder[0].style.height)

			this.updateSize(newIsVertical);

			if (oldIsVertical != newIsVertical) {
				if (this.state.isCollapsed) {
					this.toggleCollapsed();
					this.toggleCollapsed();
				}
			}

			delete this.floatData;
		};
		proto.movePanePlaceholder = function(dividerAfter) {
			var pane = this.els.pane;
			var placeholder = this.floatData.panePlaceholder;

			var oldNextDivider = placeholder.next();
			var changedPosition = dividerAfter[0] != oldNextDivider[0];

			var newParent = dividerAfter.parent();
			var oldParent = placeholder.parent();
			var changedParents = newParent[0] != oldParent[0];

			var oldIsVertical = this.state.isVertical;
			var newIsVertical = newParent.hasClass("pane-vertical");
			var changedOrientation = oldIsVertical != newIsVertical;

			//Same position, no need to do anything
			if (!changedPosition) {
				return;
			}

			//Put pane and divider in new position
			//Different position; bring-your-own-divider
			dividerAfter.after([placeholder, oldNextDivider]);

			//Don't show the previous divider of the current placeholder position
			var prevDivider = dividerAfter;
			$(".pane-was-drag-droppable").removeClass("pane-was-drag-droppable")
										 .addClass("pane-drag-droppable");
			prevDivider.toggleClass("pane-was-drag-droppable",
									prevDivider.hasClass("pane-drag-droppable"));
			prevDivider.removeClass("pane-drag-droppable");

			//Stop animating dividers
			$(".pane-divider").removeClass("pane-transition");

			//Remove size CSS and recalculate them
			placeholder.css("left", "")
					   .css("top", "")
					   .css("width", !newIsVertical ? "100%" :
					   		(changedParents ? 0 : placeholder[0].style.width))
					   .css("height", newIsVertical ? "100%" : 
					   		(changedParents ? 0 : placeholder[0].style.height))

			//Animate size changes
			placeholder.addClass("pane-transition");

			//If switched between vertical and horizontal, set the static
			// size, and turn collapsed on and off
			this.update();
			this.updateSize(newIsVertical);

			//Repaint the DOM before resizing the panes
			setTimeout(function() {
				Panes.updateSizes(newParent);
				if (changedParents) {
					Panes.updateSizes(oldParent);
				}
			}, 0);
		};
		proto.close = function() {
			if (this.floatData) {
				this.floatData.bogusContainer.remove();
			}

			var pane = this.els.pane;
			var parent = pane.parent();
			pane.next().remove();
			pane.remove();

			Panes.updateSizes(parent);
		};

		return Pane;
	})(),
	Dividers: {
		init: function (){
			DragCapture.onDragStart.register(Bound(this, this.onDragStart));
		},
		onDragStart: function (target, mouseStart, acceptParameters) {
			//Only for dividers
			if (!target.hasClass("pane-divider")) {
				return false;
			}
			var isVertical = target.parent().hasClass("pane-vertical");
		
			//Find previous and next non-collapsed panes
			var prev = target.prevAll(".pane-pane:not(.pane-collapsed)"),
				next = target.nextAll(".pane-pane:not(.pane-collapsed)");
		
			//No panes to resize
			if (prev.length == 0 || next.length == 0) {
				return false;
			}
		
			prev = $(prev[0]);
			next = $(next[0]);
			var prevSizePX = isVertical ? prev.outerWidth() : prev.outerHeight();
			var nextSizePX = isVertical ? next.outerWidth() : next.outerHeight();
			dragInfo = {
				divider: target,
				container: target.parent(),
				isVertical: isVertical,
				mouseStart: isVertical ? mouseStart.x : mouseStart.y,
				prev: prev,
				next: next,
				prevStatic: prev[0].paneData.state.isStatic,
				nextStatic: next[0].paneData.state.isStatic,
				currentPrevSizePX: prevSizePX,
				totalSizePX: prevSizePX + nextSizePX,
			}
			var totalSizePC = 0;
			var prevSizePC = prev[0].paneData.state.flexibleSize;
			var nextSizePC = next[0].paneData.state.flexibleSize;
			if (!dragInfo.prevStatic && !dragInfo.nextStatic) {
				totalSizePC = prevSizePC + nextSizePC;
			} else if (!dragInfo.prevStatic) {
				totalSizePC = prevSizePC / prevSizePX * dragInfo.totalSizePX;
			} else if (!dragInfo.nextStatic) {
				totalSizePC = nextSizePC / nextSizePX * dragInfo.totalSizePX;
			}
			dragInfo.totalSizePC = totalSizePC;

			if (dragInfo.prevStatic) {
				dragInfo.prevStaticRatio = numberAndRest(prev[0].paneData.state.staticSize).number / prevSizePX;
			}
			if (dragInfo.nextStatic) {
				dragInfo.nextStaticRatio = numberAndRest(next[0].paneData.state.staticSize).number / nextSizePX;
			}
		
			//Don't animate size changes
			dragInfo.prev.removeClass("pane-transition");
			dragInfo.next.removeClass("pane-transition");

			acceptParameters.onDragMove = Bound(this, this.onDragMove);
			acceptParameters.onDragEnd = Bound(this, this.onDragEnd);
			acceptParameters.dragExtra = dragInfo;
		
			return true;
		},
		onDragMove: function (dragInfo, mouse, mouseOffset, mouseDelta) {
			var divider = dragInfo.divider;

			if ((dragInfo.isVertical && mouseDelta.x == 0) ||
				(!dragInfo.isVertical && mouseDelta.y == 0)) {
				return;
			}
			
			//Find new sizes
			var offset = dragInfo.isVertical ? mouseOffset.x : mouseOffset.y;
			var newPrevSizePX = (dragInfo.currentPrevSizePX + offset);
			var newPrevSizePC = newPrevSizePX / dragInfo.totalSizePX * dragInfo.totalSizePC;
			var newNextSizePX = dragInfo.totalSizePX - newPrevSizePX;
			var newNextSizePC = dragInfo.totalSizePC - newPrevSizePC;
		
			//Keep a minimum of 5% for each pane
			if ((newPrevSizePC < 0.05) || (newNextSizePC < 0.05) ||
				(newPrevSizePX < 20) || (newNextSizePX < 20)) {
				return;
			}

			//Apply them
			if (dragInfo.prevStatic) {
				var nar = numberAndRest(dragInfo.prev[0].paneData.state.staticSize);
				dragInfo.prev[0].paneData.state.staticSize = (newPrevSizePX * dragInfo.prevStaticRatio) + nar.rest;
			} else {
				dragInfo.prev[0].paneData.state.flexibleSize = newPrevSizePC;
			}
			if (dragInfo.nextStatic) {
				var nar = numberAndRest(dragInfo.next[0].paneData.state.staticSize);
				dragInfo.next[0].paneData.state.staticSize = (newNextSizePX * dragInfo.nextStaticRatio) + nar.rest;
			} else {
				dragInfo.next[0].paneData.state.flexibleSize = newNextSizePC;
			}

			//Update only the relevant panes to avoid flickering
			Panes.updateSizes(dragInfo.container, [dragInfo.prev, dragInfo.next]);
		},
		onDragEnd: function (dragInfo) {
			//Update all panes
			Panes.updateSizes(dragInfo.container);

			//Animate height changes
			dragInfo.prev.addClass("pane-transition");
			dragInfo.next.addClass("pane-transition");
		},
	},
	Captions: {
		minimumDistanceForDragStart: 3.,
		dragging: false,
		setDroppableTargets: new CallbackQueue(),
		init: function () {
			DragCapture.onDragStart.register(Bound(this, this.onDragStartPreStart));
		},
		createBoundingBoxes: function (container) {
			//Get all top-level containers if no parent specified
			if (typeof container == "undefined") {
				children = $(":not(.pane-contents) > .pane-container")
					.toArray()
					.map(Panes.Captions.createBoundingBoxes);

				return children;
			}

			var container = $(container);

			var isVertical = container.hasClass("pane-vertical");
			var containerBox = container.boundingBox();

			var panes = container.children(".pane-pane");
			var paneBoxes = panes.toArray().map(function (pane) {
				return $(pane).boundingBox();
			});

			var dividers = container.children(".pane-divider");
			var dividerBoxes = dividers.toArray().map(function (divider, i){
				var boxPrev = paneBoxes[i - 1], boxNext = paneBoxes[i];
				var box = new boundingBox(boxPrev || boxNext || containerBox);

				if (boxPrev) {
					if (isVertical) {
						box.left = boxPrev.middleVertical();
					} else {
						box.top = boxPrev.middleHorizontal();
					}
				}
				if (boxNext) {
					if (isVertical) {
						box.right = boxNext.middleVertical();
					} else {
						box.bottom = boxNext.middleHorizontal();
					}
				}

				return {
					box: box,
					divider: $(divider),
				};
			});

			var children = panes.filter(".pane-has-container")
								.toArray()
								.map(function (pane) {
				var container = $("> .pane-margin > .pane-contents > .pane-container", pane);
				return Panes.Captions.createBoundingBoxes(container);
			});

			return {
				box: containerBox,
				children: children,
				dividerBoxes: dividerBoxes,
				divider: $(dividers[0]),
			};
		},
		findDividerFromMouse: function (boundingBoxes, mouse) {
			var divider;
			for (var i = 0, boundingBox ; boundingBox = boundingBoxes[i] ; i++) {
				if (boundingBox.box.contains(mouse)) {
					//Return an inner divider
					divider = this.findDividerFromMouse(boundingBox.children, mouse);
					if (divider) {
						return divider;
					}

					//Return one of our dividers
					for (var j = 0, dividerBox ; dividerBox = boundingBox.dividerBoxes[j] ; j++) {
						if (dividerBox.box.contains(mouse)) {
							return dividerBox.divider;
						}
					}

					//Return the only divider (or an bug in createBoundingBoxes)
					return boundingBox.divider;
				}
			}
		},
		onDragStartPreStart: function (target, mouseStart, acceptParameters) {
			//Only for captions
			if (target.hasClass("pane-caption-text")) {
				target = target.parent();
			}
			if (!target.hasClass("pane-caption")) {
				return false;
			}

			//Don't drag while maximized
			if (target.hasClass("pane-maximized")) {
				return false;
			}

			var pane = target.parent().parent();
			
			dragInfo = {
				pane: pane,
				mouseStart: mouseStart,
				dragStarted: false,
			}

			acceptParameters.onDragMove = Bound(this, this.onDragMovePreStart);
			acceptParameters.onDragEnd = Bound(this, this.onDragEnd);
			acceptParameters.dragExtra = dragInfo;
		
			return true;
		},
		onDragStart: function (dragInfo, mouse, mouseOffset) {
			var pane = dragInfo.pane;
			var paneData = pane[0].paneData

			//Find which containers can accept the pane
			if (this.setDroppableTargets.length) {
				var droppableTargets = this.setDroppableTargets.firstToAccept(pane);
				//No container can accept this pane
				if (typeof droppableTargets == "undefined") {
					return;
				}
				//Only target containers
				droppableTargets = droppableTargets.filter(".pane-divider");
			} else {
				droppableTargets = $(".pane-divider");
			}

			//Can't drop into inner containers
			droppableTargets = droppableTargets.not(pane.next())
											   .not($(".pane-divider", pane));

			//No container can accept this pane
			if (!droppableTargets.length) {
				return;
			}

			//Firefox: Avoid toggling the colapsed state right after a pane drag
			this.dragging = true;

			paneData.float(true);
			var panePlaceholder = paneData.floatData.panePlaceholder;
			panePlaceholder.addClass("pane-drag-droppable")
			var bogusContainer = paneData.floatData.bogusContainer;
			var paneOffset = paneData.floatData.paneOffset;
			//Add the mouse offset to account for minimumDistanceForDragStart
			paneOffset.left += mouseOffset.x;
			paneOffset.top += mouseOffset.y;

			pane.addClass("pane-dragged");
			//Highlight possible drop targets
			droppableTargets.addClass("pane-drag-droppable");
			droppableTargets.parent().addClass("pane-drag-droppable");
			//Don't show the previous divider of the current placeholder position
			var prevDivider = panePlaceholder.prev();
			prevDivider.toggleClass("pane-was-drag-droppable",
									prevDivider.hasClass("pane-drag-droppable"));
			prevDivider.removeClass("pane-drag-droppable");

			//Update drag info
			dragInfo.paneOffset = paneOffset;
			dragInfo.panePlaceholder = panePlaceholder;
			dragInfo.bogusContainer = bogusContainer;
			dragInfo.dragStarted = true;
			dragInfo.boundingBoxes = this.createBoundingBoxes();
			//Flag that indicates if panes are resizing after a movePlaceholder,
			//so we don't have the new bounding boxes
			dragInfo.pauseMovePlaceholder = false;

			//Put the pane in its position
			this.onDragMove(dragInfo, mouse, mouseOffset, mouseOffset);
		},
		onDragMovePreStart: function (dragInfo, mouse, mouseOffset, mouseDelta) {
			if (dragInfo.dragStarted) {
				this.onDragMove(dragInfo, mouse, mouseOffset, mouseDelta);
			} else {
				var distance = Math.sqrt(mouseOffset.x * mouseOffset.x +
										 mouseOffset.y * mouseOffset.y);
				if (distance >= this.minimumDistanceForDragStart) {
					this.onDragStart(dragInfo, mouse, mouseOffset);
				}
			}
		},
		onDragMove: function (dragInfo, mouse, mouseOffset, mouseDelta) {
			if (mouseDelta.x == 0 && mouseDelta.y == 0) {
				return;
			}
			//Move pane
			var pane = dragInfo.pane;
			var paneOffset = pane[0].paneData.floatData.paneOffset;
			pane.css("left", mouseOffset.x + paneOffset.left)
						 .css("top", mouseOffset.y + paneOffset.top);

			//Panes are still resizing
			if (dragInfo.pauseMovePlaceholder) {
				return;
			}

			//Highlight current divider
			$(".pane-drag-over").removeClass("pane-drag-over");
			dragInfo.divider = this.findDividerFromMouse(dragInfo.boundingBoxes, mouse);
			if (dragInfo.divider) {
				dragInfo.divider.addClass("pane-drag-over");
				this.movePanePlaceholder(dragInfo);
			}
		},
		movePanePlaceholder: function(dragInfo) {
			dragInfo.pane[0].paneData.movePanePlaceholder(dragInfo.divider);

			//Calculate the bounding boxes after resizing is done
			dragInfo.pauseMovePlaceholder = true;
			var self = this;
			setTimeout(function() {
				dragInfo.boundingBoxes = self.createBoundingBoxes();
				dragInfo.pauseMovePlaceholder = false;
			}, Panes.transitionDuration);
		},
		onDragEnd: function (dragInfo) {
			if (!dragInfo.dragStarted) {
				return;
			}

			$(".pane-drag-over").removeClass("pane-drag-over");
			$(".pane-dragged").removeClass("pane-dragged");
			$(".pane-drag-droppable").removeClass("pane-drag-droppable");
			$(".pane-was-drag-droppable").removeClass("pane-was-drag-droppable");

			//Stop animating dividers
			$(".pane-divider").removeClass("pane-transition");

			var pane = dragInfo.pane;
			var paneData = pane[0].paneData;
			paneData.float(false);

			//Animate size changes
			pane.addClass("pane-transition");

			this.dragging = false;
		},
	},
	ControlBoxes: {
		init: function() {
			this.initEventHandlers();
		},
		initEventHandlers: function() {
			$(".pane-control-minimize").click(this.onMinimize);
			$(".pane-control-maximize").click(this.onMaximize);
			$(".pane-control-restore").click(this.onRestore);
			$(".pane-control-close").click(this.onClose);
		},
		onMinimize: function () {
			//Firefox: Avoid toggling the colapsed state right after a pane drag
			if (Panes.Captions.dragging) {
				return;
			}

			var pane = $(this).closest(".pane-pane");
		
			//If pane is maximized then restore it
			if (pane.hasClass("pane-maximized")) {
				Panes.ControlBoxes.onRestore.call(this);
				setTimeout(function() {
					Panes.ControlBoxes.onMinimize.call(pane);
				}, Panes.transitionDuration);
				return;
			}

			pane.addClass("pane-transition");
			Panes.toggleCollapsed(pane);
		},
		onMaximize: function () {
			//Firefox: Avoid toggling the colapsed state right after a pane drag
			if (Panes.Captions.dragging) {
				return;
			}

			var pane = $(this).closest(".pane-pane");
			var paneData = pane[0].paneData;

			//If pane is minimized then restore it
			if (pane.hasClass("pane-minimized")) {
				pane.removeClass("pane-transition");
				Panes.ControlBoxes.onMinimize.call(this);
			}

			//If there is another maximized item then restore it
			if ($(".pane-maximized").length) {
				Panes.ControlBoxes.onRestore.call($(".pane-maximized"));
				setTimeout(function() {
					Panes.ControlBoxes.onMaximize.call(pane);
				}, Panes.transitionDuration);
				return;
			}

			paneData.float(true);
			pane.addClass("pane-transition");
			setTimeout(function() {
				pane.addClass("pane-maximized");
			}, 0);
			paneData.floatData.bogusContainer.addClass("pane-maximized");
			paneData.floatData.bogusContainer.css("background", "none");
			setTimeout(function() {
				paneData.floatData.bogusContainer.css("background", "");
			}, Panes.transitionDuration);
		},
		onRestore: function () {
			//Firefox: Avoid toggling the colapsed state right after a pane drag
			if (Panes.Captions.dragging) {
				return;
			}

			var pane = $(this).closest(".pane-pane");
			var paneData = pane[0].paneData;

			paneData.floatData.bogusContainer.css("background", "none");

			pane.removeClass("pane-maximized");
			//Shrink to placeholder's current position
			var panePlaceholder = paneData.floatData.panePlaceholder;
			var paneMargin = $("> .pane-margin", panePlaceholder);
			var paneMarginBoundingBox = paneMargin.boundingBox();
			pane.css("left", paneMarginBoundingBox.left)
				.css("top", paneMarginBoundingBox.top)
				.css("width", paneMarginBoundingBox.width())
				.css("height", paneMarginBoundingBox.height())
				.css("position", "absolute")
				.addClass("pane-transition");

			//Put back into panes grid
			setTimeout(function() {
				pane.css("position", "")
					.removeClass("pane-transition");
				paneData.float(false);

				setTimeout(function() {
					pane.addClass("pane-transition");
				}, 0);
			}, Panes.transitionDuration);
		},
		onClose: function () {
			//Firefox: Avoid toggling the colapsed state right after a pane drag
			if (Panes.Captions.dragging) {
				return;
			}
			
			var pane = $(this).closest(".pane-pane");
			var paneData = pane[0].paneData;

			if (!paneData.confirmedClose) {
				if (!confirm('Are you sure you want to close this?')) {
					return;
				}
			}

			//If pane is maximized then restore it
			if (pane.hasClass("pane-maximized")) {
				Panes.ControlBoxes.onRestore.call(this);
				paneData.confirmedClose = true;
				setTimeout(function () {
					Panes.ControlBoxes.onClose.call(pane);
				}, Panes.transitionDuration);
				return;
			}

			paneData.close();
			pane.remove();
		},
	},
};