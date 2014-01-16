mozimage.ns("mozimage.ui");

mozimage.ui.PrefsGeneral = mozimage.define({

	mozImageBundle : null,

	init : function () {
		this.mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");
		mozimage.addEventListener(window, 'pagehide', this.prefs_close, this);

		mozimage.addEventListener('folder-button', 'command', this.getFolder, this);
		mozimage.addEventListener('current-button', 'command', this.setCurrent, this);
		mozimage.addEventListener('enablecurrent-check', 'click', this.toggleEnableCurrent, this);
		mozimage.addEventListener('descending-check', 'click', this.toggleDes, this);
		mozimage.addEventListener('forcehttptumb-check', 'click', this.toggleForceHTTPTumb, this);
		mozimage.addEventListener('enablecache-check', 'click', this.toggleEnableCache, this);

		mozimage.addEventListener('jpg-check', 'click', function () {
			this.toggleExt('jpg');
		}, this);
		mozimage.addEventListener('jpeg-check', 'click', function () {
			this.toggleExt('jpeg');
		}, this);
		mozimage.addEventListener('gif-check', 'click', function () {
			this.toggleExt('gif');
		}, this);
		mozimage.addEventListener('bmp-check', 'click', function () {
			this.toggleExt('bmp');
		}, this);
		mozimage.addEventListener('png-check', 'click', function () {
			this.toggleExt('png');
		}, this);

		this.prefs_load();

	},

	prefs_load : function () {
		var homedir = document.getElementById("homedir-text");
		var delay = document.getElementById("delay-text");
		var zoom = document.getElementById("zoom-text");
		var thumbSize = document.getElementById("thumb-menu");
		var orderBy = document.getElementById("orderby-menu");
		var desChk = document.getElementById("descending-check");
		var forceHttpTumbChk = document.getElementById("forcehttptumb-check");
		var enableCacheChk = document.getElementById("enablecache-check");
		var folderButton = document.getElementById("folder-button");
		var currentButton = document.getElementById("current-button");

		var enableCurrentChk = document.getElementById("enablecurrent-check");
		try {
			if (mozimage.prefs.getEnableCurrent()) {
				homedir.setAttribute("disabled", "true");
				folderButton.setAttribute("disabled", "true");
				currentButton.setAttribute("disabled", "true");
			}
		} catch (e) {
			alert(e);
		}

		var extList = mozimage.prefs.getExtList();
		homedir.value = mozimage.prefs.getHomeDir();
		delay.value = mozimage.prefs.getDelay() / 1000;
		zoom.value = mozimage.prefs.getZoom();
		thumbSize.value = mozimage.prefs.getThumbSize();
		orderBy.value = mozimage.prefs.getOrderBy();
		desChk.checked = mozimage.prefs.getDescending();
		forceHttpTumbChk.checked = mozimage.prefs.getForceHttpTumb();
		enableCacheChk.checked = mozimage.prefs.getEnableCache();
		enableCurrentChk.checked = mozimage.prefs.getEnableCurrent();

		for (var i = 0; i < extList.length; i++) {
			var checkbox = document.getElementById(extList[i] + "-check");
			checkbox.checked = true;
		}
	},

	prefs_close : function () {
		try {
			var homedir = document.getElementById("homedir-text");
			var delay = document.getElementById("delay-text");
			var zoom = document.getElementById("zoom-text");
			var thumbMenu = document.getElementById("thumb-menu");
			var orderByMenu = document.getElementById("orderby-menu");

			mozimage.prefs.setHomeDir(homedir.value);
			mozimage.prefs.setDelay(delay.value * 1000);
			mozimage.prefs.setZoom(zoom.value);
			mozimage.prefs.setThumbSize(thumbMenu.value);
			mozimage.prefs.setOrderBy(orderByMenu.value);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	toggleForceHTTPTumb : function () {
		mozimage.prefs.setForceHttpTumb(!mozimage.prefs.getForceHttpTumb());
	},

	toggleEnableCurrent : function () {
		try {
			mozimage.prefs.setEnableCurrent(!mozimage.prefs.getEnableCurrent());
			if (mozimage.prefs.getEnableCurrent()) {
				document.getElementById("homedir-text").setAttribute("disabled", "true");
				document.getElementById("folder-button").setAttribute("disabled", "true");
				document.getElementById("current-button").setAttribute("disabled", "true");
			}
			else {
				document.getElementById("homedir-text").setAttribute("disabled", "false");
				document.getElementById("folder-button").setAttribute("disabled", "false");
				document.getElementById("current-button").setAttribute("disabled", "false");
			}
		} catch (e) {
			mozimage.showError(e);
		}
	},

	toggleDes : function () {
		mozimage.prefs.setDescending(!mozimage.prefs.getDescending());
	},

	toggleEnableCache : function () {
		mozimage.prefs.setEnableCache(!mozimage.prefs.getEnableCache());
	},

	getFolder : function () {
		try {
			var selectdir = this.mozImageBundle.GetStringFromName("choosedir");
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, selectdir, nsIFilePicker.modeGetFolder);
			fp.appendFilters(nsIFilePicker.filterAll);
			var res = fp.show();
			if (res == nsIFilePicker.returnOK) {
				var thepath = fp.file;
				document.getElementById('homedir-text').value = thepath.path;
			}
		}
		catch (e) {
			mozimage.showError(e);
		}
	},

	setCurrent : function () {
		try {
			if (top.arguments) {
				var fullpath = top.arguments[0];
				document.getElementById('homedir-text').value = fullpath.value;
			}
		} catch (e) {
			mozimage.showError(e);
		}
	},

	toggleExt : function (aExt) {
		var index = -1;
		for (var i = 0; i < mozimage.prefs.extList.length; i++) {
			if (mozimage.prefs.extList[i] == aExt)
				index = i;
		}
		if (index != -1)
			mozimage.prefs.extList.splice(index, 1);
		else
			mozimage.prefs.extList.push(aExt);
	}

});

(function () {
	window.addEventListener('load',function() {
		mozimage.prefs = top.mozimage.prefs;
		new mozimage.ui.PrefsGeneral();
	});
})();