var mozimage = {};

/**
 * Create the given namespace using a dotten notation
 * Ex. 'app.ui.forms'
 * @param {string} name
 */
mozimage.namespace = function (name) {
	var parent = window,
		parts = name.split('.'),
		i;

	for (i = 0; i < parts.length; i = i + 1) {
		if (!parent[parts[i]]) {
			parent[parts[i]] = {};
		}
		parent = parent[parts[i]];
	}

};


/**
 * Add all the properties of the source object to the target object
 * @param {Object} target the object to be modified
 * @param {Object} source the source of the new properies
 * @param {bool} overwrite true if existing properties of the target object should be overwritten
 * @returns {Object} the target object
 */

mozimage.apply = function (target, source, overwrite) {
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
};

/**
 * Basic function to declare a pseoudo class throught a configuration
 * An existing *init* function will be used as a constuctor
 * An existing *extend* property will be used as a inherited prototype
 * @param config the configuration for the new objects
 * @returns {Function}
 */

mozimage.define = function(config) {
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
};

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

/**
 * At the moment shows an alert and does a console log
 * @param e the object to show
 */

mozimage.showError = function (e) {
	console.error(e.toString());
	alert(e);
};

/**
 * Add an event listener to the target object
 * @param target name o reference to the chrome element
 * @param event name of the event handler
 * @param handler function to call
 * @param scope scope of the handler
 */

mozimage.addEventListener = function (target, event, handler, scope) {
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
};

mozimage.getService = function(aURL, aInterface) {
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
};

mozimage.createInstance = function(aURL, aInterface) {
	var rv;
	try {
		rv = Components.classes[aURL].createInstance(Components.interfaces[aInterface]);
	} catch (e) {
		rv = jslibError(e);
	}

	return rv;
};

mozimage.logError = function (msg) {
	console.error(msg);
};

mozimage.typeIsObj = function(aType) {
	return (aType && typeof(aType) == "object");
};

mozimage.typeIsFunc = function(aType) {
	return (aType && typeof(aType) == "function");
};

mozimage.typeIsStr = function(aType) {
	return (aType && typeof(aType) == "string");
};

mozimage.typeIsNum = function(aType) {
	return (aType && typeof(aType) == "number");
};

mozimage.typeIsUndef = function(aType) {
	return (aType && typeof(aType) == "undefined");
};

mozimage.ns = mozimage.namespace;

mozimage.VOID = void(null);
mozimage.NS_OK = Components.results.NS_OK;
