# Resizable and draggable panes for the browser

See the demo page at http://costas-basdekis.github.io/Panes.js/

Very simply add this to your page:

```html
<script src="./callbackqueue.js"></script>
<script src="./dragcapture.js"></script>
<script src="./panes.js"></script>

<div class="pane-container pane-vertical">
	<div class="pane-pane" pane-caption"Hello World">

	</div>
	<div class="pane-pane" pane-caption="Another pane" data-pane-fixed-width="300px">
		This pane doesn't resize when its parent resizes
	</div>
</div>
<script type="text/javascript">
	Panes.init();
</script>
```

Containers and panes must be div, all classes used have a pane-prefix. Panes.js will modify the structure of the DOM, so the contenets of a .pane-pane will be in a .pane-container after init()
