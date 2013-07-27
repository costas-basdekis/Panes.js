# Resizable and draggable panes for the browser

See the demo page at http://costas-basdekis.github.io/Panes.js/

Very simply add this to your page:

```html
<script src="./utils.js"></script>
<script src="./dragcapture.js"></script>
<script src="./panes.js"></script>

<div class="pane-container pane-vertical">
	<div class="pane-pane" data-pane-options='{"caption":{"text":"Hello World!"}}'>

	</div>
	<div class="pane-pane" data-pane-options='{"caption":{"text":"Another pane"}, "fixedWidth":"300px"}'>
		This pane doesn't resize when its parent resizes
	</div>
</div>
<script type="text/javascript">
	Panes.init();
</script>
```
