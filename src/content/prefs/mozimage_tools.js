prefs = top.prefs;
var mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");

/*
 **
 ** Prefs window event handlers
 **
 */

function openFilerConvert() {
	try {
		var selectdir = mozImageBundle.GetStringFromName("choosedir");
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, selectdir, nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterAll);
		var res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var thepath = fp.file;
			//prefs.setHomeDir(thefile.path);
			if (navigator.platform == "Win32")
				document.getElementById('convertpath-text').value = "'" + thepath.path + "'";
			else
				document.getElementById('convertpath-text').value = thepath.path;
		}
	} catch (e) {
		alert(e);
	}
}

function prefs_load() {
	var editorsName = prefs.getEditorsName();
	var editorsPath = prefs.getEditorsPath();
	var macroName = prefs.getMacroName();
	var macroCode = prefs.getMacroCode();

	var convertPath = document.getElementById("convertpath-text");
	if (convertPath) convertPath.value = prefs.getConvertPath();

	for (var i = 1; i <= 4; i++) {
		var edit = document.getElementById("editorname" + i + "-text");
		if (edit) edit.value = editorsName[i - 1];
		var edit = document.getElementById("editorpath" + i + "-text");
		if (edit) edit.value = editorsPath[i - 1];
	}

	for (var i = 0; i < 10; i++) {
		var edit = document.getElementById("macroname" + i + "-text");
		if (edit) edit.value = macroName[i];
		var edit = document.getElementById("macrocode" + i + "-text");
		if (edit) edit.value = macroCode[i];
	}
}

function prefs_close() {
	try {
		var convertPath = document.getElementById("convertpath-text").value;
		var editorsName = new Array();
		var editorsPath = new Array();
		var macroName = new Array();
		var macroCode = new Array();

		for (var i = 1; i <= 4; i++) {
			var edit = document.getElementById("editorname" + i + "-text");
			editorsName[i - 1] = edit.value;
			var edit = document.getElementById("editorpath" + i + "-text");
			editorsPath[i - 1] = edit.value;
		}
		for (var i = 0; i < 10; i++) {
			var edit = document.getElementById("macroname" + i + "-text");
			macroName[i] = edit.value;
			var edit = document.getElementById("macrocode" + i + "-text");
			macroCode[i] = edit.value;
		}
		prefs.setConvertPath(convertPath);
		prefs.setEditorsName(editorsName);
		prefs.setEditorsPath(editorsPath);
		prefs.setMacroName(macroName);
		prefs.setMacroCode(macroCode);
	} catch (e) {
		alert(e);
	}
}

