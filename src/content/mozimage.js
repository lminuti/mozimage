var mozimage = {};

if (!mozimage.loaded) {

	mozimage.loaded = true;

	// Basic function to declare a pseoudo class
	// throught a configuration. Every function
	// and variable of the configuration will be
	// copied to the class and the function named
	// *init* will be used as a construtor
	//

	mozimage.define = function (name, config) {
		var parent = window,
			parts = name.split('.'),
			i, ctor;

		for (i = 0; i < parts.length - 1; i = i + 1) {
			if (!parent[parts[i]]) {
				parent[parts[i]] = {};
			}
			parent = parent[parts[i]];
		}

		ctor = function () {
			if (this.init) {
				this.init.apply(this, arguments);
			}
		};
		ctor.prototype = config;
		parent[parts[parts.length - 1]] = ctor;

		return ctor;
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

	// For now it simple shows an alert
	mozimage.showError = function (e) {
		console.error(e.toString());
		alert(e);
	};

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

}
