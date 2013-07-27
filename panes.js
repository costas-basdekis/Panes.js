
Panes = {
	transitionDuration: 200,
	init: function () {
		this.initDOM();
		this.initSizes();
		this.updateSizes();
	
		this.Dividers.init();
		this.Captions.init();
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
			pane = $(pane);

			var margin = $("<div class='pane-margin'></div>");

			//Add caption
			if (pane.is("[data-pane-caption]")) {
				pane.addClass("pane-has-caption");
				var captionText = pane.attr("data-pane-caption");
				var caption = $("<div class='pane-caption pane-transition' " +
					"title='" + captionText + "'>" + captionText + "</div>");
				caption.click(Panes.Captions.onClick);
				margin.append(caption);
			}

			//Add contents
			var contents = $("<div class='pane-contents'></div>");
			contents.append(pane.contents());
			margin.append(contents);

			//Check for just a container pane
			var paneChildren = contents.children();
			if (paneChildren.length == 2 && paneChildren.hasClass("pane-container")) {
				pane.addClass("pane-has-container");
			}

			pane.append(margin);
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
	
		//Enable transitions only after the page has loaded, and elements have
		//been sized
		setTimeout(function() {$(".pane-pane").addClass("pane-transition");}, Panes.transitionDuration);
	},
	initSizes: function () {
		//Initialize every pane to have equal size
		$(".pane-container").each(function (i, container) {
			container = $(container);
	
			var children = container.children(".pane-pane");
			var metric = container.hasClass("pane-vertical") ? "width" : "height";
			var size = 1. / children.length;
	
			children.attr("data-pane-size", size)
					.attr("data-pane-metric", metric)
					.attr("data-pane-static", false);

			//Static panes
			children.filter("[data-pane-fixed-" + metric + "]")
					.each(function (i, pane) {
				pane = $(pane);

				pane.attr("data-pane-static-size",
						  pane.attr("data-pane-fixed-" + metric))
					.attr("data-pane-static", true);
			});
			
			//Collapsed panes
			children.filter(".pane-collapsed").each(function(i, pane) {
				Panes.toggleCollapsed($(pane));
			})
		});
	},
	//Change the pane sizes to reflect the data
	updateSizes: function (containers) {
		if (typeof containers == "undefined") {
			containers = $(".pane-container");
		}
	
		containers.each(function (i, container) {
			container = $(container);
	
			var flexiblePanes = container.children(".pane-pane[data-pane-static=false]");
			var staticPanes = container.children(".pane-pane[data-pane-static=true]");
			var isVertical = container.hasClass("pane-vertical");
			var metric = isVertical ? "width" : "height";
	
			//Find the total static size
			var totalstaticSize = staticPanes.toArray()
											 .reduce(function (total, pane) {
				return total + parseInt($(pane).attr("data-pane-static-size"));
			}, 0);
	
			//Find the total flexible percentage
			var totalFlexibleSize = flexiblePanes.toArray()
												 .reduce(function (total, pane) {
				return total + parseFloat($(pane).attr("data-pane-size"));
			}, 0.);
	
			//Put the flexibles calculated sizes
			flexiblePanes.each(function (i, pane) {
				pane = $(pane);
				var size = pane.attr("data-pane-size");
	
				//Fallback for Safari < 6.0 and others that don't support calc
				pane.css(metric, (size / totalFlexibleSize * 100.) + "%");
				if (totalstaticSize > 0) {
					var newSize = "calc((100% - " + totalstaticSize + "px) * " +
								  (size / totalFlexibleSize) + ")";
					//Fallback for Safari 6.0+
					pane.css(metric, "-webkit-" + newSize);
					pane.css(metric,              newSize);
				}
			});

			//Set static non-collapsed panes size
			staticPanes.filter(":not(.pane-collapsed)").each(function (i, pane) {
				pane = $(pane);

				pane.css(metric, pane.attr("data-pane-static-size"));
			});
		})
	},
	toggleCollapsed: function (pane) {
		var container = pane.parent();
		var isVertical = container.hasClass("pane-vertical");
		var metric = isVertical ? "width" : "height";
		var size = pane.attr("data-pane-size")
		var contents = $("> .pane-margin > .pane-contents", pane);
		var caption = $("> .pane-margin > .pane-caption", pane);
		var collapsed = pane.hasClass("pane-collapsed");
	
		//Toggle state
		collapsed = !collapsed;
		pane.toggleClass("pane-collapsed", collapsed);
		pane.attr("data-pane-static", collapsed);
	
		//Set size
		if (collapsed) {
			var captionHeight = caption.outerHeight();
	
			//Find the collapsed size by getting the caption height, plus the padding
			//due to surrounding dividers
			var dividerSize = parseInt(pane.siblings(".pane-divider").css(metric));
			var isInMiddle = pane.is(":not(:first-of-type):not(:last-of-type)");
			var staticSize = captionHeight + dividerSize / (isInMiddle ? 1. : 2.);
	
			//Rotate vertical captions
			if (isVertical) {
				caption.addClass("pane-caption-rotate");
				pane.css("width", staticSize);
			}
	
			pane.attr("data-pane-static-size", staticSize)
				.css("height", staticSize);
			contents.fadeOut(this.transitionDuration);
		} else {
			//Unrotate vertical captions
			caption.removeClass("pane-caption-rotate").css("top", "");
	
			pane.removeAttr("data-pane-static-size")
				.css("height", "");
			if (pane.is("[data-pane-fixed-" + metric + "]")) {
				pane.attr("data-pane-static-size",
						  pane.attr("data-pane-fixed-" + metric));
				pane.attr("data-pane-static", true);
			}
			contents.fadeIn(Panes.transitionDuration);
		}
	
		//Resize flexible panes
		this.updateSizes(container);
	},
	initDrag: function () {
	},
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
				prevStatic: prev.attr("data-pane-static") == "true",
				nextStatic: next.attr("data-pane-static") == "true",
				currentPrevSizePX: prevSizePX,
				totalSizePX: prevSizePX + nextSizePX,
			}
			var totalSizePC = 0;
			var prevSizePC = parseFloat(prev.attr("data-pane-size"));
			var nextSizePC = parseFloat(next.attr("data-pane-size"));
			if (!dragInfo.prevStatic && !dragInfo.nextStatic) {
				totalSizePC = prevSizePC + nextSizePC;
			} else if (!dragInfo.prevStatic) {
				totalSizePC = prevSizePC / prevSizePX * dragInfo.totalSizePX;
			} else if (!dragInfo.nextStatic) {
				totalSizePC = nextSizePC / nextSizePX * dragInfo.totalSizePX;
			}
			dragInfo.totalSizePC = totalSizePC;
		
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
				dragInfo.prev.attr("data-pane-static-size", newPrevSizePX);
			} else {
				dragInfo.prev.attr("data-pane-size", newPrevSizePC);
			}
			if (dragInfo.nextStatic) {
				dragInfo.next.attr("data-pane-static-size", newNextSizePX);
			} else {
				dragInfo.next.attr("data-pane-size", newNextSizePC);
			}
			Panes.updateSizes(dragInfo.container);
		},
		onDragEnd: function (dragInfo) {
			//Animate height changes
			dragInfo.prev.addClass("pane-transition");
			dragInfo.next.addClass("pane-transition");
		},
	},
	Captions: {
		minimumDistanceForDragStart: 3.,
		dragging: false,
		setDropableTargets: new CallbackQueue(),
		init: function () {
			DragCapture.onDragStart.register(Bound(this, this.onDragStartPreStart));
		},
		onClick: function () {
			//Firefox: Avoid toggling the colapsed state right after a pane drag
			if (Panes.Captions.dragging) {
				return;
			}

			var caption = $(this);
			var pane = caption.parent().parent();
		
			Panes.toggleCollapsed(pane);
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
			if (!target.hasClass("pane-caption")) {
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

			//Find which containers can accept the pane
			if (this.setDropableTargets.length) {
				var dropableTargets = this.setDropableTargets.firstToAccept(pane);
				//No container can accept this pane
				if (typeof dropableTargets == "undefined" ||
					dropableTargets.length == 0) {
					return;
				}
			} else {
				dropableTargets = $(".pane-container");
			}
			dropableTargets.addClass("pane-drag-dropable");

			//Firefox: Avoid toggling the colapsed state right after a pane drag
			this.dragging = true;

			var paneOffset = pane.offset();
			//Subtract the body offset, because we will move the pane in
			//relation to the body
			var bodyOffset = $("body").offset();
			paneOffset.left -= bodyOffset.left;
			paneOffset.top -= bodyOffset.top;
			//Add the mouse offset to account for minimumDistanceForDragStart
			paneOffset.left += mouseOffset.x;
			paneOffset.top += mouseOffset.y;

			//Put placeholder in pane's position
			var panePlaceholder = $("<div class='pane-pane pane-placeholder'></div>");
			panePlaceholder.css("width", pane[0].style.width)
						   .css("height", pane[0].style.height);
			pane.css("width", pane.outerWidth())
				.css("height", pane.outerHeight());
			pane.after(panePlaceholder);
			pane.removeClass("pane-transition");

			//Create a bogus container to put the pane, so that we can move it around
			var bogusContainer = $("<div class='pane-container pane-bogus'/>");
			var isVertical = pane.parent().hasClass("pane-vertical");
			bogusContainer.toggleClass("pane-vertical", isVertical)
						  .toggleClass("pane-horizontal", !isVertical);
			bogusContainer.prependTo($("body"));

			//Put the pane in the bogus container
			bogusContainer.append(pane);
			pane.addClass("pane-dragged");

			//Animate dividers
			$(".pane-divider").addClass("pane-transition");

			//Update drag info
			dragInfo.paneOffset = paneOffset;
			dragInfo.panePlaceholder = panePlaceholder;
			dragInfo.bogusContainer = bogusContainer;
			dragInfo.dragStarted = true;
			dragInfo.boundingBoxes = this.createBoundingBoxes();

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
			dragInfo.pane.css("left", mouseOffset.x + dragInfo.paneOffset.left)
						 .css("top", mouseOffset.y + dragInfo.paneOffset.top);

			//Highlight current divider
			$(".pane-drag-over").removeClass("pane-drag-over");
			dragInfo.divider = this.findDividerFromMouse(dragInfo.boundingBoxes, mouse);
			if (dragInfo.divider) {
				dragInfo.divider.addClass("pane-drag-over");
			}
		},
		onDragEnd: function (dragInfo) {
			if (!dragInfo.dragStarted) {
				return;
			}

			$(".pane-drag-over").removeClass("pane-drag-over");
			$(".pane-dragged").removeClass("pane-dragged");
			$(".pane-drag-dropable").removeClass("pane-drag-dropable");

			var pane = dragInfo.pane;
			var placeholder = dragInfo.panePlaceholder;

			var divider = dragInfo.divider;
			var oldNextDivider = placeholder.next();
			var changedPosition = divider[0] != oldNextDivider[0];

			var newParent = divider.parent();
			var oldParent = placeholder.parent();
			var changedParents = newParent[0] != oldParent[0];
			var newIsVertical = newParent.hasClass("pane-vertical");

			//Put pane and divider in new position
			if (changedPosition) {
				//Different position; bring-your-own-divider
				divider.after([pane,oldNextDivider]);
			} else {
				placeholder.after(pane);
			}

			//Discard the placeholder and bogus container
			placeholder.remove();
			dragInfo.bogusContainer.remove();

			//Stop animating dividers
			$(".pane-divider").removeClass("pane-transition");

			//Remove size CSS and recalculate them
			var oldMetric = pane.attr("data-pane-metric");
			var newMetric = placeholder.attr("data-pane-metric");
			pane.css("left", "")
				.css("top", "")
				.attr("data-pane-metric", newMetric)
				.css("width", !newIsVertical ? "100%" :
							  (changedParents ? 0 : placeholder[0].style.width))
				.css("height", newIsVertical ? "100%" : 
							   (changedParents ? 0 : placeholder[0].style.height))

			//Animate size changes
			pane.addClass("pane-transition");

			if (changedPosition) {
				//If switched between vertical and horizontal, set the static
				// size, and turn collapsed on and off
				if (oldMetric != newMetric) {
					//Update static size
					var fixedSize =  pane.attr("data-pane-fixed-" + newMetric);
					if (fixedSize) {
						pane.attr("data-pane-static-size", fixedSize);
					}
					pane.attr("data-pane-fixed", fixedSize);

					//Update collapsed size
					if (pane.hasClass("pane-collapsed")) {
						Panes.toggleCollapsed(pane);
						Panes.toggleCollapsed(pane);
					}
				}

				//Repaint the DOM before resizing the panes
				setTimeout(function() {
					Panes.updateSizes(newParent);
					if (changedParents) {
						Panes.updateSizes(oldParent);
					}

					//Firefox: Avoid toggling the colapsed state right after a
					// pane drag
					Panes.Captions.dragging = false;
				}, 0);
			} else {
				//Firefox: Avoid toggling the colapsed state right after a pane
				//drag
				Panes.Captions.dragging = false;				
			}
		},
	},
};