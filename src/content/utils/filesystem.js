mozimage.ns("mozimage.utils");

mozimage.utils.FileSystem = mozimage.define({

	JS_FS_LOCAL_CID : "@mozilla.org/file/local;1",
	JS_FS_NETWORK_CID : '@mozilla.org/network/standard-url;1',
	JS_FS_URL_COMP : "nsIURL",

	init: function (aPath) {
		if (aPath < 0)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		this.initComponents();

		// support nsIFile method names
		this.isExecutable = this.isExec;
		this.isDirectory = this.isDir;
		this.initWithPath = this.initPath;
		this.moveTo = this.move;
		this.copyTo = this.copy;

		return (aPath ? this.initPath(arguments) : mozimage.VOID);
	},


	mPath: null,
	mFileInst: null,

	initComponents : function () {
		this.JS_FS_File_nsIFile = new Components.Constructor(
			this.JS_FS_LOCAL_CID,
			"nsILocalFile",
			"initWithPath"
		);

		this.JS_FS_URL = new Components.Constructor(
			this.JS_FS_NETWORK_CID,
			this.JS_FS_URL_COMP
		);
	},

	/**
	 * INITPATH
	 */
	initPath: function (args) {
		// check if the argument is a file:// url
		var fileURL;
		if (mozimage.typeIsObj(args)) {
			for (var i = 0; i < args.length; i++) {
				if (args[i].search(/^file:/) == 0) {
					try {
						fileURL = new this.JS_FS_URL;
						fileURL.spec = args[i];
						args[i] = fileURL.path;
					} catch (e) {
						return mozimage.logError(e);
					}
				}
			}
		} else {
			if (args.search(/^file:/) == 0) {
				try {
					fileURL = new this.JS_FS_URL;
					fileURL.spec = args;
					args = fileURL.path;
				} catch (e) {
					return mozimage.logError(e);
				}
			}
		}

		/**
		 * If you are wondering what all this extra cruft is, well
		 * this is here so you can reinitialize 'this' with a new path
		 */
		var rv = null;
		try {
			if (typeof(args.path) == "string") {
				if (typeof(args.isDirectory) == "function" &&
					args.isDirectory())
					return mozimage.logError("NS_ERROR_FILE_IS_DIRECTORY");

				this.mFileInst = new this.JS_FS_File_nsIFile(args.path);
				rv = this.mPath = this.mFileInst.path;
			} else if (mozimage.typeIsObj(args)) {
				this.mFileInst = new this.JS_FS_File_nsIFile(args[0] ? args[0] : this.mPath);
				if (args.length > 1)
					for (i = 1; i < args.length; i++)
						this.mFileInst.append(args[i]);
				(args[0] || this.mPath) ? rv = this.mPath = this.mFileInst.path : rv = null;
			} else {
				this.mFileInst = new this.JS_FS_File_nsIFile(args ? args : this.mPath);
				this.mFileInst.path ? rv = this.mPath = this.mFileInst.path : rv = null;
			}
		} catch (e) {
			return mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * CHECKINST
	 */
	checkInst: function () {
		return (this.mFileInst && this.mPath);
	},

	/**
	 * PATH
	 */
	get path() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		return this.mFileInst.path;
	},

	/**
	 * EXISTS
	 */
	exists: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv = false;
		try {
			rv = this.mFileInst.exists();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * GET LEAF
	 */
	get leaf() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.leafName;
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * SET LEAF
	 */
	set leaf(aLeaf) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!aLeaf)
			mozimage.logError("NS_ERROR_INVALID_ARG");

		var rv;
		try {
			rv = (this.mFileInst.leafName = aLeaf);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * PARENT
	 */
	get parent() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			if (this.mFileInst.parent.isDirectory()) {
				rv = new mozimage.utils.Dir(this.mFileInst.parent.path);
			}
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * GET PERMISSIONS
	 */
	get permissions() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!this.exists())
			return mozimage.logError("NS_ERROR_FILE_NOT_FOUND");

		var rv;
		try {
			rv = parseInt(this.mFileInst.permissions.toString(8));
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * SET PERMISSIONS
	 */
	set permissions(aPermission) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!aPermission)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		if (!this.exists())
			return mozimage.logError("NS_ERROR_FILE_NOT_FOUND");

		if (!this.validatePermissions(aPermission))
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.permissions = aPermission;
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * VALIDATEPERMISSIONS
	 */
	validatePermissions: function (aNum) {
		if (typeof(aNum) != 'number' || parseInt(aNum.toString(10).length) < 3)
			return false;

		return true;
	},

	/**
	 * DATEMODIFIED
	 */
	get dateModified() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!this.exists())
			return mozimage.logError("NS_ERROR_FILE_NOT_FOUND");

		var rv;
		try {
			rv = (new Date(this.mFileInst.lastModifiedTime));
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * RESETCACHE
	 */
	resetCache: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv = false;
		if (this.mPath) {
			delete this.mFileInst;
			try {
				this.mFileInst = new this.JS_FS_File_nsIFile(this.mPath);
				rv = true;
			} catch (e) {
				mozimage.logError(e);
			}
		}

		return rv;
	},

	/**
	 * NSIFILE
	 */
	get nsIFile() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.clone();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/***************************
	 *  NOTE: after a move      *
	 *  successful, 'this' will *
	 *  be reinitialized        *
	 *  to the moved file!      *
	 ***************************/
	move: function (aDest) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!aDest)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		if (typeof(aDest) == "object")
			if (typeof(aDest.path) != "string")
				return mozimage.logError("NS_ERROR_INVALID_ARG");
			else
				aDest = aDest.path;

		var rv;
		var newName = null;
		try {
			var f = new this.JS_FS_File_nsIFile(aDest);
			if (f.exists() && !f.isDirectory())
				return mozimage.logError("NS_ERROR_FILE_ALREADY_EXISTS");

			if (f.equals(this.mFileInst))
				return mozimage.logError("NS_ERROR_FILE_COPY_OR_MOVE_FAILED");

			if (!f.exists() && f.parent.exists())
				newName = f.leafName;

			if (f.equals(this.mFileInst.parent) && !newName)
				return mozimage.logError("NS_ERROR_FILE_IS_DIRECTORY");

			var dir = f.parent;
			if (dir.exists() && dir.isDirectory()) {
				this.mFileInst.moveTo(dir, newName);
				this.mPath = f.path;
				this.resetCache();
				delete dir;
				rv = mozimage.NS_OK;
			} else {
				rv = mozimage.logError("NS_ERROR_INVALID_ARG");
			}
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * APPEND
	 */
	append: function (aLeaf) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!aLeaf)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		var rv;
		try {
			this.mFileInst.append(aLeaf);
			rv = this.mPath = this.path;
		} catch (e) {
			rv = mozimage.logError("NS_ERROR_UNEXPECTED");
		}

		return rv;
	},

	/**
	 * APPENDRELATIVEPATH
	 */
	appendRelativePath: function (aRelPath) {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!aRelPath)
			return mozimage.logError("NS_ERROR_INVALID_ARG");

		var rv;
		try {
			this.mFileInst.appendRelativePath(aRelPath);
			rv = this.mPath = this.path;
		} catch (e) {
			mozimage.logError("NS_ERROR_UNEXPECTED");
		}

		return rv;
	},

	/**
	 * GET URL
	 */
	get URL() {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		try {
			var ph = mozimage.createInstance("@mozilla.org/network/protocol;1?name=file",
				"nsIFileProtocolHandler");

			var rv = ph.getURLSpecFromFile(this.mFileInst);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * ISDIR
	 */
	isDir: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isDirectory();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISFILE
	 */
	isFile: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isFile();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISEXEC
	 */
	isExec: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isExecutable();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISSYMLINK
	 */
	isSymlink: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isSymlink();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISWRITABLE
	 */
	isWritable: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isWritable();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISREADABLE
	 */
	isReadable: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isReadable();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISHIDDEN
	 */
	isHidden: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isHidden();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * ISSPECIAL
	 */
	isSpecial: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		var rv;
		try {
			rv = this.mFileInst.isSpecial();
		} catch (e) {
			rv = false;
		}

		return rv;
	},

	/**
	 * NORMALIZE
	 */
	normalize: function () {
		if (!this.checkInst())
			return mozimage.logError("NS_ERROR_NOT_INITIALIZED");

		if (!this.exists())
			return mozimage.logError("NS_ERROR_FILE_NOT_FOUND");

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.normalize();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * EQUALS
	 */
	equals: function (aFileObj) {
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

			rv = this.mFileInst.equals(fo);
		} catch (e) {
			rv = false;
		}

		return rv;
	}

});
