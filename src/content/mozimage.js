var mozimage = {

	strBundleService : null,

	debug: false,

	/**
	 * Create the given namespace using a dotten notation
	 * Ex. 'app.ui.forms'
	 * @param {string} name
	 */
	namespace : function (name) {
		var parent = window,
			parts = name.split('.'),
			i;

		for (i = 0; i < parts.length; i = i + 1) {
			if (!parent[parts[i]]) {
				parent[parts[i]] = {};
			}
			parent = parent[parts[i]];
		}

	},


	/**
	 * Add all the properties of the source object to the target object
	 * @param {Object} target the object to be modified
	 * @param {Object} source the source of the new properies
	 * @param {boolean} overwrite true if existing properties of the target object should be overwritten
	 * @returns {Object} the target object
	 */

	apply : function (target, source, overwrite) {
		if (source) {
			var names = Object.getOwnPropertyNames(source), i, name, prop;
			for (i = 0 ; i < names.length ; i++) {
				name = names[i];
				if (overwrite || (typeof target[name] === 'undefined')) {
					prop = Object.getOwnPropertyDescriptor(source, name);
					Object.defineProperty(target, name, prop);
					//target[name] = o[name];
				}
			}
		}
		return target;
	},

	/**
	 * Basic function to declare a pseoudo class throught a configuration
	 * An existing *init* function will be used as a constuctor
	 * An existing *extend* property will be used as a inherited prototype
	 * @param {Object} config the configuration for the new objects
	 * @returns {Function} the new object constructor
	 */

	define : function(config) {
		var proto;
		var constructor = function () {
			if (this.init) {
				this.init.apply(this, arguments);
			}
		};
		if  (config.extend) {
			proto = config.extend.prototype;
		}
		constructor.prototype = mozimage.apply(config, proto);
		return constructor;
	},

	/**
	 * Add an event listener to the target object
	 * @param target name o reference to the chrome element
	 * @param event name of the event handler
	 * @param handler function to call
	 * @param scope scope of the handler
	 */

	addEventListener : function (target, event, handler, scope) {
		var el;
		if (typeof target == "string") {
			el = document.getElementById(target);
			if (!el) {
				throw Error('Cannot find element: ' + target);
			}
			target = el;
		}
		target.addEventListener(event, function (e) {
			handler.call(scope, e);
		});
	},

	/**
	 * Load a javascript script into the current scope.
	 * It also check if the file is already loaded
	 * @param aScriptPath
	 */
	include : function (aScriptPath) {
		if (!aScriptPath) {
			throw Error("include: Missing file path argument");
		}

		if (!this.includedFiles) {
			this.includedFiles = [];
		}

		// Check if already included
		if (this.includedFiles.indexOf(aScriptPath) < 0) {
			mozimage.getService("@mozilla.org/moz/jssubscript-loader;1",
				"mozIJSSubScriptLoader").loadSubScript(aScriptPath);

			mozimage.log('*** mozimage.include: ' + aScriptPath);
			this.includedFiles.push(aScriptPath);
		}

	},

	/**
	 * Dynamically load a string bundle
	 * @param path the path/url of the string boundle
	 * @returns {Object/null} returns null in case of error
	 */
	getStrBundle : function(path)
	{
		var strBundle = null;

		if (!mozimage.strBundleService) {
			try {
				mozimage.strBundleService = mozimage.getService("@mozilla.org/intl/stringbundle;1", "nsIStringBundleService");
			} catch (ex) {
				mozimage.logError("** strBundleService failed: " + ex);
				return null;
			}
		}

		strBundle = mozimage.strBundleService.createBundle(path);
		if (!strBundle) {
			mozimage.logError("\n--** strBundle createInstance failed **--\n");
		}
		return strBundle;
	},

	/**
	 * At the moment shows an alert and does a console log
	 * @param e the object to show
	 */

	showError : function (e) {
		mozimage.logError(e.toString());
		alert(e);
	},

	/**
	 * In in debug mode show the error in console
	 * @param msg the message
	 */

	logError : function (msg) {
		if (mozimage.debug) {
			console.error(msg);
		}
	},

	/**
	 * In in debug mode show the message in console
	 * @param msg the message
	 */

	log : function (msg) {
		if (mozimage.debug) {
			console.log(msg);
		}
	},

	/**
	 * Check if the argument is an object
	 * @param aType
	 * @returns {boolean}
	 */
	typeIsObj : function(aType) {
		return (aType && typeof(aType) == "object");
	},

	/**
	 * Check if the argument is a function
	 * @param aType
	 * @returns {boolean}
	 */
	typeIsFunc : function(aType) {
		return (aType && typeof(aType) == "function");
	},

	/**
	 * Check if the argument is a string
	 * @param aType
	 * @returns {*|boolean}
	 */
	typeIsStr : function(aType) {
		return (aType && typeof(aType) == "string");
	},

	/**
	 * Check if the argument is a number
	 * @param aType
	 * @returns {*|boolean}
	 */
	typeIsNum : function(aType) {
		return (aType && typeof(aType) == "number");
	},

	/**
	 * Check if the argument is undefined
	 * @param aType
	 * @returns {boolean}
	 */
	typeIsUndef : function(aType) {
		return (aType && typeof(aType) == "undefined");
	}

};

mozimage.xul = {

	VOID : void(null),

	// Ex JSLIB_OK
	NS_OK : Components.results.NS_OK,

	getService : function(aURL, aInterface) {
		var rv;
		// determine how 'aInterface' is passed and handle accordingly
		switch (typeof(aInterface)) {
			case "object":
				rv = Components.classes[aURL].getService(aInterface);
				break;

			case "string":
				rv = Components.classes[aURL].getService(Components.interfaces[aInterface]);
				break;

			default:
				rv = Components.classes[aURL].getService();
				break;
		}
		return rv;
	},

	createInstance : function(aURL, aInterface) {
		var rv;
		try {
			rv = Components.classes[aURL].createInstance(Components.interfaces[aInterface]);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	qIntf : function(aObj, aInterface) {
		try {
			return aObj.QueryInterface(Components.interfaces[aInterface]);
		} catch (e) {
			return mozimage.logError(e);
		}
	},

	installButton : function (toolbarId, id, afterId) {
		// https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Toolbar?redirectlocale=en-US&redirectslug=Code_snippets%2FToolbar
		if (!document.getElementById(id)) {
			var toolbar = document.getElementById(toolbarId);

			// If no afterId is given, then append the item to the toolbar
			var before = null;
			if (afterId) {
				var elem = document.getElementById(afterId);
				if (elem && elem.parentNode == toolbar)
					before = elem.nextElementSibling;
			}

			toolbar.insertItem(id, before);
			toolbar.setAttribute("currentset", toolbar.currentSet);
			document.persist(toolbar.id, "currentset");

			if (toolbarId == "addon-bar")
				toolbar.collapsed = false;
		}
	}

};


// Aliases
mozimage.ns = mozimage.namespace;

mozimage.NS_OK = mozimage.xul.NS_OK;
mozimage.VOID = mozimage.xul.VOID;
mozimage.getService = mozimage.xul.getService;
mozimage.createInstance = mozimage.xul.createInstance;
mozimage.qIntf = mozimage.xul.qIntf;

/*
 ** Event handler for the overlay
 */

mozimage.run = function (getLink) {
	// mozimage_url is copied into the sidebar object because
	// if the toggleSidebar function is called for the first
	// time and create the sidebar, when the code reach the
	// call to fillListBox the sidebar probably will not
	// exist yet. So the mozimage_url is copied in the sidebar
	// object and during the window_load is read and used.

	try {
		var sidebar = document.getElementById("sidebar");
		var imageUrl = gBrowser.contentWindow.location.href;
		toggleSidebar('viewMozImageSidebar', true);
		if (getLink) {
			if (sidebar.contentWindow.fillListBox)
				sidebar.contentWindow.fillListBox(imageUrl);
			else
				sidebar.setAttribute('mozimage_url', imageUrl);
		}
	} catch (e) {
		mozimage.showError(e);
	}
};

(function () {
	window.addEventListener('load',function(e) {
		mozimage.include("chrome://mozimage/content/prefs/mozimage_prefs.js");
		if (mozimage.prefs.firstRun) {
			mozimage.xul.installButton("nav-bar", "mozimage-button");
			// The "addon-bar" is available since Firefox 4
			mozimage.xul.installButton("addon-bar", "mozimage-button");
		}
	});
})();