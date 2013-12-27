mozimage.define('mozimage.PrefsGeneral', {

	prefs : top.prefs,

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
			if (this.prefs.getEnableCurrent()) {
				homedir.setAttribute("disabled", "true");
				folderButton.setAttribute("disabled", "true");
				currentButton.setAttribute("disabled", "true");
			}
		} catch (e) {
			alert(e);
		}

		var extList = this.prefs.getExtList();
		homedir.value = this.prefs.getHomeDir();
		delay.value = this.prefs.getDelay() / 1000;
		zoom.value = this.prefs.getZoom();
		thumbSize.value = this.prefs.getThumbSize();
		orderBy.value = this.prefs.getOrderBy();
		desChk.checked = this.prefs.getDescending();
		forceHttpTumbChk.checked = this.prefs.getForceHttpTumb();
		enableCacheChk.checked = this.prefs.getEnableCache();
		enableCurrentChk.checked = this.prefs.getEnableCurrent();

		for (var i = 0; i < extList.length; i++) {
			var checkbox = document.getElementById(extList[i] + "-check");
			checkbox.checked = true;
		}
	},

	prefs_close : function () {
		jslibDebug('save gen page');
		try {
			var homedir = document.getElementById("homedir-text");
			var delay = document.getElementById("delay-text");
			var zoom = document.getElementById("zoom-text");
			var thumbMenu = document.getElementById("thumb-menu");
			var orderByMenu = document.getElementById("orderby-menu");

			this.prefs.setHomeDir(homedir.value);
			this.prefs.setDelay(delay.value * 1000);
			this.prefs.setZoom(zoom.value);
			this.prefs.setThumbSize(thumbMenu.value);
			this.prefs.setOrderBy(orderByMenu.value);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	toggleForceHTTPTumb : function () {
		this.prefs.setForceHttpTumb(!this.prefs.getForceHttpTumb());
	},

	toggleEnableCurrent : function () {
		try {
			this.prefs.setEnableCurrent(!this.prefs.getEnableCurrent());
			if (this.prefs.getEnableCurrent()) {
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
		this.prefs.setDescending(!this.prefs.getDescending());
	},

	toggleEnableCache : function () {
		this.prefs.setEnableCache(!this.prefs.getEnableCache());
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
		for (var i = 0; i < this.prefs.extList.length; i++) {
			if (this.prefs.extList[i] == aExt)
				index = i;
		}
		if (index != -1)
			this.prefs.extList.splice(index, 1);
		else
			this.prefs.extList.push(aExt);
	}

});

(function () {
	window.addEventListener('load',function() {
		new mozimage.PrefsGeneral();
	});
})();