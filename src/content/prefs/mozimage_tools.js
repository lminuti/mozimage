mozimage.ns("mozimage.ui");

mozimage.ui.PrefsTools = mozimage.define({

	mozImageBundle : null,

	init : function () {
		this.mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");
		mozimage.addEventListener(window, 'pagehide', this.prefs_close, this);

		mozimage.addEventListener('open-filerconvert-button', 'command', this.openFilerConvert, this);

		this.prefs_load();
	},

	prefs_load : function () {
		var editorsName = mozimage.prefs.getEditorsName();
		var editorsPath = mozimage.prefs.getEditorsPath();
		var macroName = mozimage.prefs.getMacroName();
		var macroCode = mozimage.prefs.getMacroCode();
		var edit, i;

		var convertPath = document.getElementById("convertpath-text");
		if (convertPath) convertPath.value = mozimage.prefs.getConvertPath();

		for (i = 1; i <= 4; i++) {
			edit = document.getElementById("editorname" + i + "-text");
			if (edit) edit.value = editorsName[i - 1];
			edit = document.getElementById("editorpath" + i + "-text");
			if (edit) edit.value = editorsPath[i - 1];
		}

		for (i = 0; i < 10; i++) {
			edit = document.getElementById("macroname" + i + "-text");
			if (edit) edit.value = macroName[i];
			edit = document.getElementById("macrocode" + i + "-text");
			if (edit) edit.value = macroCode[i];
		}
	},

	prefs_close : function () {
		try {
			var convertPath = document.getElementById("convertpath-text").value;
			var editorsName = [];
			var editorsPath = [];
			var macroName = [];
			var macroCode = [];
			var edit, i;

			for (i = 1; i <= 4; i++) {
				edit = document.getElementById("editorname" + i + "-text");
				editorsName[i - 1] = edit.value;
				edit = document.getElementById("editorpath" + i + "-text");
				editorsPath[i - 1] = edit.value;
			}
			for (i = 0; i < 10; i++) {
				edit = document.getElementById("macroname" + i + "-text");
				macroName[i] = edit.value;
				edit = document.getElementById("macrocode" + i + "-text");
				macroCode[i] = edit.value;
			}
			mozimage.prefs.setConvertPath(convertPath);
			mozimage.prefs.setEditorsName(editorsName);
			mozimage.prefs.setEditorsPath(editorsPath);
			mozimage.prefs.setMacroName(macroName);
			mozimage.prefs.setMacroCode(macroCode);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	openFilerConvert : function () {
		try {
			var selectdir = this.mozImageBundle.GetStringFromName("choosedir");
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, selectdir, nsIFilePicker.modeOpen);
			fp.appendFilters(nsIFilePicker.filterAll);
			var res = fp.show();
			if (res == nsIFilePicker.returnOK) {
				var thepath = fp.file;
				//mozimage.prefs.setHomeDir(thefile.path);
				if (navigator.platform == "Win32")
					document.getElementById('convertpath-text').value = "'" + thepath.path + "'";
				else
					document.getElementById('convertpath-text').value = thepath.path;
			}
		} catch (e) {
			mozimage.showError(e);
		}
	}

});

(function () {
	window.addEventListener('load',function() {
		mozimage.prefs = top.mozimage.prefs;
		new mozimage.ui.PrefsTools();
	});
})();