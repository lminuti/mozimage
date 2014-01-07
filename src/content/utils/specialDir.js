mozimage.define('mozimage.utils.SpecialDir', {

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt
	 */
	NS_APP_PREFS_50_DIR: "PrefD",

	/**
	 * /usr/src/mozilla/dist/bin/chrome
	 */
	NS_APP_CHROME_DIR: "AChrom",

	/**
	 * /root/.mozilla
	 */
	NS_APP_USER_PROFILES_ROOT_DIR: "DefProfRt",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt
	 */
	NS_APP_USER_PROFILE_50_DIR: "ProfD",

	/**
	 * /root/.mozilla
	 */
	NS_APP_APPLICATION_REGISTRY_DIR: "AppRegD",

	/**
	 * /root/.mozilla/appreg
	 */
	NS_APP_APPLICATION_REGISTRY_FILE: "AppRegF",

	/**
	 * /usr/src/mozilla/dist/bin/defaults
	 */
	NS_APP_DEFAULTS_50_DIR: "DefRt",

	/**
	 * /usr/src/mozilla/dist/bin/defaults/pref
	 */
	NS_APP_PREF_DEFAULTS_50_DIR: "PrfDef",

	/**
	 * /usr/src/mozilla/dist/bin/defaults/profile/US
	 */
	NS_APP_PROFILE_DEFAULTS_50_DIR: "profDef",

	/**
	 * /usr/src/mozilla/dist/bin/defaults/profile
	 */
	NS_APP_PROFILE_DEFAULTS_NLOC_50_DIR: "ProfDefNoLoc",

	/**
	 * /usr/src/mozilla/dist/bin/res
	 */
	NS_APP_RES_DIR: "ARes",

	/**
	 * /usr/src/mozilla/dist/bin/plugins
	 */
	NS_APP_PLUGINS_DIR: "APlugns",

	/**
	 * /usr/src/mozilla/dist/bin/searchplugins
	 */
	NS_APP_SEARCH_DIR: "SrchPlugns",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/prefs.js
	 */
	NS_APP_PREFS_50_FILE: "PrefF",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/chrome
	 */
	NS_APP_USER_CHROME_DIR: "UChrm",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/localstore.rdf
	 */
	NS_APP_LOCALSTORE_50_FILE: "LclSt",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/history.dat
	 */
	NS_APP_HISTORY_50_FILE: "UHist",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/panels.rdf
	 */
	NS_APP_USER_PANELS_50_FILE: "UPnls",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/mimeTypes.rdf
	 */
	NS_APP_USER_MIMETYPES_50_FILE: "UMimTyp",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/bookmarks.html
	 */
	NS_APP_BOOKMARKS_50_FILE: "BMarks",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/search.rdf
	 */
	NS_APP_SEARCH_50_FILE: "SrchF",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/Mail
	 */
	NS_APP_MAIL_50_DIR: "MailD",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/ImapMail
	 */
	NS_APP_IMAP_MAIL_50_DIR: "IMapMD",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/News
	 */
	NS_APP_NEWS_50_DIR: "NewsD",

	/**
	 * /root/.mozilla/Default User/k1m30xaf.slt/panacea.dat
	 */
	NS_APP_MESSENGER_FOLDER_CACHE_50_DIR: "MFCaD",

// Useful OS System Dirs

	/**
	 * /usr/src/mozilla/dist/bin
	 */
	NS_OS_CURRENT_PROCESS_DIR: "CurProcD",

	NS_OS_DESKTOP_DIR: "Desk",

	/**
	 * /root
	 */
	NS_OS_HOME_DIR: "Home",

	/**
	 * /tmp
	 */
	NS_OS_TEMP_DIR: "TmpD",

	/**
	 * /usr/src/mozilla/dist/bin/components
	 */
	NS_XPCOM_COMPONENT_DIR: "ComsD",


	useObj: false,

	getPath: function (aAppID) {
		const JS_DIRUTILS_FILE_DIR_CID = "@mozilla.org/file/directory_service;1";
		const JS_DIRUTILS_I_PROPS = "nsIProperties";
		const JS_DIRUTILS_NSIFILE = jslibI.nsIFile;

		if (!aAppID)
			mozimage.showError("NS_ERROR_INVALID_ARG");

		var rv;
		try {
			rv = jslibGetService(JS_DIRUTILS_FILE_DIR_CID, JS_DIRUTILS_I_PROPS)
				.get(aAppID, JS_DIRUTILS_NSIFILE);
			if (this.useObj) {
				if (rv.isFile()) {
					include(jslib_file);
					rv = new File(rv.path);
				} else if (rv.isDirectory()) {
					include(jslib_dir);
					rv = new Dir(rv.path);
				}
			} else {
				rv = rv.path;
			}
		} catch (e) {
			rv = jslibError(e);
		}

		return rv;
	},

	getPrefsDir: function () {
		return this.getPath(this.NS_APP_PREFS_50_DIR);
	},

	getChromeDir: function () {
		return this.getPath(this.NS_APP_CHROME_DIR);
	},

	getMozHomeDir: function () {
		return this.getPath(this.NS_APP_USER_PROFILES_ROOT_DIR);
	},

	getMozUserHomeDir: function () {
		return this.getPath(NS_APP_USER_PROFILE_50_DIR);
	},

	getAppRegDir: function () {
		return this.getPath(this.NS_APP_APPLICATION_REGISTRY_FILE);
	},

	getAppDefaultDir: function () {
		return this.getPath(this.NS_APP_DEFAULTS_50_DIR);
	},

	getAppDefaultPrefDir: function () {
		return this.getPath(this.NS_APP_PREF_DEFAULTS_50_DIR);
	},

	getProfileDefaultsLocDir: function () {
		return this.getPath(this.NS_APP_PROFILE_DEFAULTS_50_DIR);
	},

	getProfileDefaultsDir: function () {
		return this.getPath(this.NS_APP_PROFILE_DEFAULTS_NLOC_50_DIR);
	},

	getAppResDir: function () {
		return this.getPath(this.NS_APP_RES_DIR);
	},

	getAppPluginsDir: function () {
		return this.getPath(this.NS_APP_PLUGINS_DIR);
	},

	getSearchPluginsDir: function () {
		return this.getPath(this.NS_APP_SEARCH_DIR);
	},

	getPrefsFile: function () {
		return this.getPath(this.NS_APP_PREFS_50_FILE);
	},

	getUserChromeDir: function () {
		return this.getPath(this.NS_APP_USER_CHROME_DIR);
	},

	getLocalStore: function () {
		return this.getPath(this.NS_APP_LOCALSTORE_50_FILE);
	},

	getHistoryFile: function () {
		return this.getPath(this.NS_APP_HISTORY_50_FILE);
	},

	getPanelsFile: function () {
		return this.getPath(this.NS_APP_USER_PANELS_50_FILE);
	},

	getMimeTypes: function () {
		return this.getPath(this.NS_APP_USER_MIMETYPES_50_FILE);
	},

	getBookmarks: function () {
		return this.getPath(this.NS_APP_BOOKMARKS_50_FILE);
	},

	getSearchFile: function () {
		return this.getPath(this.NS_APP_SEARCH_50_FILE);
	},

	getUserMailDir: function () {
		return this.getPath(this.NS_APP_MAIL_50_DIR);
	},

	getUserImapDir: function () {
		return this.getPath(this.NS_APP_IMAP_MAIL_50_DIR);
	},

	getUserNewsDir: function () {
		return this.getPath(this.NS_APP_NEWS_50_DIR);
	},

	getMessengerFolderCache: function () {
		return this.getPath(this.NS_APP_MESSENGER_FOLDER_CACHE_50_DIR);
	},

	getCurProcDir: function () {
		return this.getPath(this.NS_OS_CURRENT_PROCESS_DIR);
	},

	getHomeDir: function () {
		return this.getPath(this.NS_OS_HOME_DIR);
	},

	getDesktopDir: function () {
		return this.getPath(this.NS_OS_DESKTOP_DIR);
	},

	getTmpDir: function () {
		return this.getPath(this.NS_OS_TEMP_DIR);
	},

	getComponentsDir: function () {
		return this.getPath(this.NS_XPCOM_COMPONENT_DIR);
	}

});
