mozimage.define('mozimage.PrefsDialog', {

	init : function () {
		// Reference of the current object to use inside the callbacks
		var me = this;
		// Retrieve a reference to the main widgets
		this.dialog = document.getElementById("mozimage-prefs-dialog");
		this.prefsCategories = document.getElementById("prefsCategories");

		// Link the event handlers
		mozimage.addEventListener(this.dialog, 'dialogaccept', this.prefs_close, this);
		mozimage.addEventListener(this.prefsCategories, 'command', function (event) {
			this.switchPage(event.target.id);
		} , this);

	},

	prefs_load : function () {
		prefs.load();
	},

	prefs_close : function () {
		try {
			var panelFrame = document.getElementById("panelFrame");
			if (panelFrame.contentWindow.prefs_close)
				panelFrame.contentWindow.prefs_close();
			prefs.save();
		} catch (e) {
			alert(e);
		}
	},

	switchPage : function (aButtonID) {
		try {
			var button = document.getElementById(aButtonID);
			if (button) {
				var panelFrame = document.getElementById("panelFrame");
				var header = document.getElementById("header");
				var newURL = button.getAttribute("url");
				var newLabel = button.getAttribute("label");
				if (panelFrame.contentWindow.prefs_close)
					panelFrame.contentWindow.prefs_close();
				panelFrame.setAttribute("src", newURL);
				header.setAttribute("title", newLabel);
				button.checked = true;
				button.focus();
			}
		}
		catch (e) {
			alert(e);
		}
	}
});

(function () {
	window.addEventListener('load',function(evento) {
		new mozimage.PrefsDialog();
	});
})();
