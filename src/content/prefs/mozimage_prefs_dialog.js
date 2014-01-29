mozimage.ns("mozimage.ui");

mozimage.ui.PrefsDialog = mozimage.define({

	init : function () {
		// Reference of the current object to use inside the callbacks
		var me = this;
		// Retrieve a reference to the main widgets
		this.dialog = document.getElementById("mozimage-prefs-dialog");
		this.prefsCategories = document.getElementById("prefsCategories");

		// Link the event handlers
		mozimage.bind(this.dialog, 'dialogaccept', this.prefs_close, this);
		mozimage.bind(this.prefsCategories, 'command', function (event) {
			this.switchPage(event.target.id);
		} , this);

		this.prefs_load();
	},

	prefs_load : function () {
		mozimage.prefs.load();

		var prefsCategories = document.getElementById("prefsCategories");
		var button = prefsCategories.childNodes[0];
		document.getElementById("panelFrame").setAttribute("src", button.getAttribute("url"));
		button.checked = true;
	},

	prefs_close : function () {
		var me = this;
		try {
			var panelFrame = document.getElementById("panelFrame");
			// I must wait that the page save its own state
			panelFrame.addEventListener('pagehide', function () {
				mozimage.prefs.save();
			});
		} catch (e) {
			mozimage.showError(e);
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
			mozimage.showError(e);
		}
	}
});

(function () {
	window.addEventListener('load',function(evento) {
		mozimage.prefs = window.arguments[0].prefs;
		new mozimage.ui.PrefsDialog();
	});
})();
