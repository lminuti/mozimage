mozimage.ns("mozimage.utils");

mozimage.utils.Dir = mozimage.define({

	extend: mozimage.utils.FileSystem,

	JS_DIR_DIRECTORY : 0x01,  // 1

	JS_DIR_DEFAULT_PERMS : 0755,

	init : function (aPath) {
		if (!aPath)
			throw Error("mozimage.utils.Dir: not enought args");

		this.initComponents();
		var rv;
		if (mozimage.typeIsObj(aPath))
			rv = aPath.path;
		else
			rv = arguments;

		return this.initPath(rv);
	},

	fileInst : null,

	create : function (aPermissions) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (this.exists())
			return mozimage.logError("NS_ERROR_FILE_ALREADY_EXISTS");

		var checkedPerms;
		if (mozimage.typeIsNum(aPermissions)) {
			checkedPerms = this.validatePermissions(aPermissions);

			if (!checkedPerms)
				return mozimage.logError("NS_ERROR_INVALID_ARG");

			checkedPerms = aPermissions;
		} else {
			var p = this.mFileInst.parent;
			while (p && !p.exists())
				p = p.parent;

			checkedPerms = p.permissions;
		}

		if (!checkedPerms) checkedPerms = this.JS_DIR_DEFAULT_PERMS;

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.create(this.JS_DIR_DIRECTORY, checkedPerms);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	createUnique : function (aPermissions) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var checkedPerms;
		if (jslibTypeIsNumber(aPermissions)) {
			checkedPerms = this.validatePermissions(aPermissions);

			if (!checkedPerms)
				return mozimage.logError("NS_ERROR_INVALID_ARG");

			checkedPerms = aPermissions;
		} else {
			var p = this.mFileInst.parent;
			while (p && !p.exists())
				p = p.parent;

			checkedPerms = p.permissions;
		}

		if (!checkedPerms) checkedPerms = this.JS_DIR_DEFAULT_PERMS;

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.createUnique(this.JS_DIR_DIRECTORY, checkedPerms);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	readDir : function () {
		if (!this.exists())
			return mozimage.logError("NS_ERROR_FILE_TARGET_DOES_NOT_EXIST");

		var rv = JS_LIB_OK;
		try {
			if (!this.isDir())
				return mozimage.logError("NS_ERROR_FILE_NOT_DIRECTORY");

			var files = this.mFileInst.directoryEntries;
			var listings = new Array();
			var file;

			include(jslib_file);
			while (files.hasMoreElements()) {
				file = files.getNext().QueryInterface(jslibI.nsILocalFile);
				if (file.isFile())
					listings.push(new File(file.path));

				if (file.isDirectory())
					listings.push(new mozimage.utils.Dir(file.path));
			}

			rv = listings;
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	clone : function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		return new mozimage.utils.Dir(this.mPath);
	},

	contains : function (aFileObj) {
		if (!aFileObj)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			var fo;
			if (typeof(aFileObj.nsIFile) == "object")
				fo = aFileObj.nsIFile;
			else
				fo = aFileObj;

			rv = this.mFileInst.contains(fo, true);
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	remove : function (aRecursive) {
		if (typeof(aRecursive) != 'boolean')
			aRecursive = false;

		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!this.mPath)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		var rv = JS_LIB_OK;
		try {
			if (!this.exists())
				return mozimage.logError("NS_ERROR_FILE_TARGET_DOES_NOT_EXIST");

			if (!this.isDir())
				return mozimage.logError("NS_ERROR_FILE_NOT_DIRECTORY");

			this.mFileInst.remove(aRecursive);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	}


});
