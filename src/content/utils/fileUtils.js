mozimage.include("chrome://mozimage/content/utils/dir.js");

mozimage.ns("mozimage.utils");

mozimage.utils.FileUtils = mozimage.define({

	JS_FILEUTILS_LOCAL_CID : "@mozilla.org/file/local;1",
	JS_FILEUTILS_IO_SERVICE_CID : '@mozilla.org/network/io-service;1',
	JS_FILEUTILS_CHROME_REG_PROGID : '@mozilla.org/chrome/chrome-registry;1',
	JS_FILEUTILS_PROCESS_CID : "@mozilla.org/process/util;1",

	init : function () {

		this.JS_FILEUTILS_nsIFile = new Components.Constructor(
			this.JS_FILEUTILS_LOCAL_CID,
			"nsIFile",
			"initWithPath"
		);

		this.mDirUtils = new mozimage.utils.SpecialDir();

	},

	exists: function (aPath) {
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		return (new this.JS_FILEUTILS_nsIFile(aPath)).exists();

	},

	remove: function (aPath) {
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aPath))
			throw Error("NS_ERROR_FILE_TARGET_DOES_NOT_EXIST");

		var fileInst = new this.JS_FILEUTILS_nsIFile(aPath);

		if (fileInst.isDirectory())
			throw Error("NS_ERROR_FILE_IS_DIRECTORY");

		fileInst.remove(false);
	},

	copy: function (aSource, aDest) {
		if (!aSource || !aDest)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aSource))
			throw Error("NS_ERROR_UNEXPECTED");

		var fileInst = new this.JS_FILEUTILS_nsIFile(aSource);
		var dir = new this.JS_FILEUTILS_nsIFile(aDest);
		var copyName = fileInst.leafName;

		if (fileInst.isDirectory())
			throw Error("NS_ERROR_FILE_IS_DIRECTORY");

		if (!this.exists(aDest) || !dir.isDirectory()) {
			copyName = dir.leafName;
			dir = new this.JS_FILEUTILS_nsIFile(dir.path.replace(copyName, ''));

			if (!this.exists(dir.path))
				throw Error("NS_ERROR_FILE_ALREADY_EXISTS");

			if (!dir.isDirectory())
				throw Error("NS_ERROR_FILE_INVALID_PATH");
		}

		if (this.exists(this.append(dir.path, copyName)))
			throw Error("NS_ERROR_FILE_ALREADY_EXISTS");

		fileInst.copyTo(dir, copyName);

	},

	append: function (aDirPath, aFileName) {
		if (!aDirPath || !aFileName)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aDirPath))
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		var rv;
		var fileInst = new this.JS_FILEUTILS_nsIFile(aDirPath);
		if (fileInst.exists() && !fileInst.isDirectory()) {
			throw Error("NS_ERROR_INVALID_ARG");
		}

		fileInst.append(aFileName);
		rv = fileInst.path;
		delete fileInst;

		return rv;
	},

	size: function (aPath) {
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aPath))
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		var rv = 0;
		rv = (new this.JS_FILEUTILS_nsIFile(aPath)).fileSize;

		return rv;
	},

	ext: function (aPath) {
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aPath))
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		var rv;
		var leafName = (new this.JS_FILEUTILS_nsIFile(aPath)).leafName;
		var dotIndex = leafName.lastIndexOf('.');
		rv = (dotIndex >= 0) ? leafName.substring(dotIndex + 1) : "";

		return rv;
	},


	run: function (aPath, aArgs, aBlocking) {
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.exists(aPath))
			throw Error("NS_ERROR_FILE_TARGET_DOES_NOT_EXIST");

		var len = 0;
		if (aArgs) len = aArgs.length;
		else aArgs = null;

		var rv;
		var fileInst = new this.JS_FILEUTILS_nsIFile(aPath);

		// XXX commenting out this check as it fails on OSX
		// if (!fileInst.isExecutable())
		// return mozimage.logError("NS_ERROR_INVALID_ARG");

		if (fileInst.isDirectory())
			throw Error("NS_ERROR_FILE_IS_DIRECTORY");

		/**
		 * Create and execute the process ...
		 *
		 * NOTE: The first argument of the process instance's 'run' method
		 *       below specifies the blocking state (false = non-blocking).
		 *       The last argument, in theory, contains the process ID (PID)
		 *       on return if a variable is supplied--not sure how to implement
		 *       this with JavaScript though.
		 */
		var theProcess = mozimage.createInstance(this.JS_FILEUTILS_PROCESS_CID, "nsIProcess");

		theProcess.init(fileInst);

		var blocking = (aBlocking != undefined);

		rv = theProcess.run(blocking, aArgs, len);

		return rv;
	},

});