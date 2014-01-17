mozimage.ns("mozimage.utils");

mozimage.include("chrome://mozimage/content/utils/filesystem.js");

mozimage.utils.File = mozimage.define({

	extend : mozimage.utils.FileSystem,

	JS_FILE_IOSERVICE_CID : "@mozilla.org/network/io-service;1",
	JS_FILE_I_STREAM_CID : "@mozilla.org/scriptableinputstream;1",
	JS_FILE_OUTSTREAM_CID : "@mozilla.org/network/file-output-stream;1",
	JS_FILE_BINOUTSTREAM_CID : "@mozilla.org/binaryoutputstream;1",
	JS_FILE_BININSTREAM_CID : "@mozilla.org/binaryinputstream;1",

	JS_FILE_F_TRANSPORT_SERVICE_CID : "@mozilla.org/network/file-transport-service;1",

	JS_FILE_I_IOSERVICE : Components.interfaces.nsIIOService,
	JS_FILE_I_SCRIPTABLE_IN_STREAM : "nsIScriptableInputStream",
	JS_FILE_I_FILE_OUT_STREAM : Components.interfaces.nsIFileOutputStream,
	JS_FILE_I_BINARY_OUT_STREAM : "nsIBinaryOutputStream",
	JS_FILE_I_BINARY_IN_STREAM : "nsIBinaryInputStream",

	JS_FILE_READ : 0x01,  // 1
	JS_FILE_WRITE : 0x08,  // 8
	JS_FILE_APPEND : 0x10,  // 16

	JS_FILE_READ_MODE : "r",
	JS_FILE_WRITE_MODE : "w",
	JS_FILE_APPEND_MODE : "a",
	JS_FILE_BINARY_MODE : "b",

	JS_FILE_FILE_TYPE : 0x00,  // 0
	JS_FILE_CHUNK : 1024,  // buffer for readline => set to 1k
	JS_FILE_DEFAULT_PERMS : 0644,

	/***
	 * Possible values for the ioFlags parameter
	 * From:
	 * http://lxr.mozilla.org/seamonkey/source/nsprpub/pr/include/prio.h#601
	 */

	// #define PR_RDONLY       0x01
	// #define PR_WRONLY       0x02
	// #define PR_RDWR         0x04
	// #define PR_CREATE_FILE  0x08
	// #define PR_APPEND       0x10
	// #define PR_TRUNCATE     0x20
	// #define PR_SYNC         0x40
	// #define PR_EXCL         0x80

	JS_FILE_NS_RDONLY : 0x01,
	JS_FILE_NS_WRONLY : 0x02,
	JS_FILE_NS_RDWR : 0x04,
	JS_FILE_NS_CREATE_FILE : 0x08,
	JS_FILE_NS_APPEND : 0x10,
	JS_FILE_NS_TRUNCATE : 0x20,
	JS_FILE_NS_SYNC : 0x40,
	JS_FILE_NS_EXCL : 0x80,

/**
	 * class constructor
	 * aPath is an argument of string local file path
	 * returns NS_OK on success, exception upon failure
	 *   Ex:
	 *     var p = '/tmp/foo.dat';
	 *     var f = new File(p);
	 * @param aPath path of the file
	 * @constructor
	 */
	init : function(aPath)  {
		var rv;
		if (!aPath)
			throw Error("NS_ERROR_INVALID_ARG");

		this.JS_FILE_InputStream = new Components.Constructor(
			this.JS_FILE_I_STREAM_CID,
			this.JS_FILE_I_SCRIPTABLE_IN_STREAM
		);

		this.JS_FILE_IOSERVICE = mozimage.getService(
			this.JS_FILE_IOSERVICE_CID,
			this.JS_FILE_I_IOSERVICE
		);

		this.initComponents();

		// if the argument is a File or nsIFile object
		if (mozimage.typeIsObj(aPath)) {
			rv = aPath.path;
		} else {
			rv = arguments;
		}

		return this.initPath(rv);
	},

	// member vars
	mMode : null,
	mIsBinary : false,
	mFileChannel : null,
	mTransport : null,
	mURI : null,
	mOutStream : null,
	mInputStream : null,
	mLineBuffer : null,
	mPosition : 0,

	/********************* OPEN *************************************
	 * bool open(aMode, aPerms)                                      *
	 *                                                               *
	 * opens a file handle to read, write or append                  *
	 * aMode is an argument of string 'w', 'a', 'r', 'b'             *
	 * returns true on success, null on failure                      *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *                                                               *
	 *   outputs: void(null)                                         *
	 ****************************************************************/

	open : function (aMode, aPerms) {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (this.exists() && this.mFileInst.isDirectory())
			throw Error("NS_ERROR_FILE_IS_DIRECTORY");

		// close any existing file handles
		this.close();

		if (this.mMode)
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (!this.mURI) {
			if (!this.exists())
				this.create();
			this.mURI = this.JS_FILE_IOSERVICE.newFileURI(this.mFileInst);
		}

		if (!aMode)
			aMode = this.JS_FILE_READ_MODE;

		this.resetCache();
		var rv;

		this.mIsBinary = false;
		var access;
		while (aMode.length > 0) {
			switch (aMode[0]) {
				case this.JS_FILE_WRITE_MODE:
				case this.JS_FILE_APPEND_MODE:
				case this.JS_FILE_READ_MODE:
				{
					access = aMode[0];
					break;
				}
				case this.JS_FILE_BINARY_MODE:
				{
					this.mIsBinary = true;
					break;
				}
				default:
					throw Error("NS_ERROR_INVALID_ARG");
			}
			aMode = aMode.substring(1);
		}
		aMode = access;

		switch (aMode) {
			case this.JS_FILE_WRITE_MODE:
			case this.JS_FILE_APPEND_MODE:
			{
				if (!this.mFileChannel)
					this.mFileChannel = this.JS_FILE_IOSERVICE.newChannelFromURI(this.mURI);

				if (aPerms && this.validatePermissions(aPerms))
					this.mFileInst.permissions = aPerms;

				if (!aPerms)
					aPerms = this.JS_FILE_DEFAULT_PERMS;

				try {
					var offSet = 0;
					this.mMode = aMode;
					// create a filestream
					var fs = mozimage.createInstance(
						this.JS_FILE_OUTSTREAM_CID,
						this.JS_FILE_I_FILE_OUT_STREAM
					);
					if (aMode == this.JS_FILE_WRITE_MODE)
						fs.init(this.mFileInst, this.JS_FILE_NS_TRUNCATE |
							this.JS_FILE_NS_WRONLY, aPerms, null);
					else
						fs.init(this.mFileInst, this.JS_FILE_NS_RDWR |
							this.JS_FILE_NS_APPEND, aPerms, null);

					this.mOutStream = fs;
					if (this.mIsBinary) {
						// wrap a nsIBinaryOutputStream around the actual file
						var binstream = mozimage.createInstance(
							this.JS_FILE_BINOUTSTREAM_CID,
							this.JS_FILE_I_BINARY_OUT_STREAM
						);
						binstream.setOutputStream(this.mOutStream);
						this.mOutStream = binstream;
					}
				} catch (e) {
					return mozimage.logError(e);
				}
				rv = JS_LIB_OK;
				break;
			}

			case this.JS_FILE_READ_MODE:
			{
				if (!this.exists())
					throw Error("NS_ERROR_FILE_NOT_FOUND");

				this.mMode = this.JS_FILE_READ_MODE;

				try {
					this.mFileChannel = this.JS_FILE_IOSERVICE.newChannelFromURI(this.mURI);
					this.mLineBuffer = new Array();
					if (this.mIsBinary) {
						// wrap a nsIBinaryInputStream around the nsIInputStream
						this.mInputStream = mozimage.createInstance(
							this.JS_FILE_BININSTREAM_CID,
							this.JS_FILE_I_BINARY_IN_STREAM
						);
						this.mInputStream.setInputStream(this.mFileChannel.open());
					} else {
						// wrap a nsIScriptableInputStream around the nsIInputStream
						this.mInputStream = new this.JS_FILE_InputStream();
						this.mInputStream.init(this.mFileChannel.open());
					}
					rv = JS_LIB_OK;
				} catch (e) {
					rv = mozimage.logError(e);
				}

				break;
			}

			default:
				throw Error("NS_ERROR_INVALID_ARG");
		}

		return rv;
	},

	/********************* READ *************************************
	 * string read()                                                 *
	 *                                                               *
	 * reads a file if the file is binary it will                    *
	 * return type ex: ELF                                           *
	 * takes no arguments needs an open read mode filehandle         *
	 * returns string on success, null on failure                    *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.open();                                                 *
	 *     f.read();                                                 *
	 *                                                               *
	 *   outputs: <string contents of foo.dat>                       *
	 ****************************************************************/

	read : function (aSize) {
		if (!this.checkInst() || !this.mInputStream)
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (this.mMode != this.JS_FILE_READ_MODE) {
			this.close();
			throw Error("NS_ERROR_NOT_AVAILABLE");
		}

		var rv;
		try {
			if (!aSize)
				aSize = this.mFileInst.fileSize;

			if (this.mIsBinary)
				rv = this.mInputStream.readByteArray(aSize);
			else
				rv = this.mInputStream.read(aSize);

			this.mInputStream.close();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* READLINE**********************************
	 * string readline()                                             *
	 *                                                               *
	 * reads a file if the file is binary it will                    *
	 * return type string                                            *
	 * takes no arguments needs an open read mode filehandle         *
	 * returns string on success, null on failure                    *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.open();                                                 *
	 *     while(!f.EOF)                                             *
	 *       dump("line: "+f.readline()+"\n");                       *
	 *                                                               *
	 *   outputs: <string line of foo.dat>                           *
	 ****************************************************************/

	readline : function () {
		if (!this.checkInst() || !this.mInputStream)
			throw Error("NS_ERROR_NOT_INITIALIZED");

		var rv = null;
		var buf = null;
		var tmp = null;
		try {
			if (this.mLineBuffer.length < 2) {
				buf = this.mInputStream.read(this.JS_FILE_CHUNK);
				this.mPosition = this.mPosition + this.JS_FILE_CHUNK;
				if (this.mPosition > this.mFileInst.fileSize)
					this.mPosition = this.mFileInst.fileSize;
				if (buf) {
					if (this.mLineBuffer.length == 1) {
						tmp = this.mLineBuffer.shift();
						buf = tmp + buf;
					}
					this.mLineBuffer = buf.split(/[\n\r]/);
				}
			}
			rv = this.mLineBuffer.shift();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* READALLINES ******************************
	 * string array readAllLines()                                   *
	 *                                                               *
	 * returns array string on success, null on failure              *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     var lines = f.readAllLines();                             *
	 *                                                               *
	 *   outputs: <string array of foo.dat>                          *
	 ****************************************************************/

	readAllLines : function () {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		var rv = null;
		try {
			var fis = mozimage.createInstance("@mozilla.org/network/file-input-stream;1",
				"nsIFileInputStream");
			fis.init(this.mFileInst, -1, -1, false);

			var lis = mozimage.qIntf(fis, "nsILineInputStream");
			var line = { value: "" };
			var more = false;
			var lines = [];

			do {
				more = lis.readLine(line);
				lines.push(line.value);
			} while (more);

			fis.close();
			rv = lines;

		} catch (e) {
			mozimage.logError(e);
		}

		return rv;
	},

	/********************* EOF **************************************
	 * bool getter EOF()                                             *
	 *                                                               *
	 * boolean check 'end of file' status                            *
	 * return type boolean                                           *
	 * takes no arguments needs an open read mode filehandle         *
	 * returns true on eof, false when not at eof                    *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.open();                                                 *
	 *     while(!f.EOF)                                             *
	 *       dump("line: "+f.readline()+"\n");                       *
	 *                                                               *
	 *   outputs: true or false                                      *
	 ****************************************************************/

	get EOF() {
		if (!this.checkInst() || !this.mInputStream)
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if ((this.mLineBuffer.length > 0) ||
			(this.mInputStream.available() > 0))
			return false;

		return true;
	},

	/********************* WRITE ************************************
	 * write()                                                       *
	 *                                                               *
	 *  Write data to a file                                         *
	 *                                                               *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.open("w");                                              *
	 *     f.write();                                                *
	 *                                                               *
	 *   outputs: JS_LIB_OK upon success                             *
	 ****************************************************************/

	write : function (aBuffer) {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (this.mMode == this.JS_FILE_READ_MODE) {
			this.close();
			throw Error("NS_ERROR_FILE_READ_ONLY");
		}

		if (!aBuffer) aBuffer = "";

		var rv = JS_LIB_OK;
		try {
			if (this.mIsBinary && aBuffer.constructor == Array)
				this.mOutStream.writeByteArray(aBuffer, aBuffer.length);
			else
				this.mOutStream.write(aBuffer, aBuffer.length);

			this.mOutStream.flush();
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* COPY *************************************
	 * void copy(aDest)                                              *
	 *                                                               *
	 * void file close                                               *
	 * return type void(null)                                        *
	 * takes no arguments closes an open file stream and             *
	 * deletes member var instances of objects                       *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     fopen();                                                  *
	 *     f.close();                                                *
	 *                                                               *
	 *   outputs: JS_LIB_OK upon success                             *
	 ****************************************************************/

	copy : function (aDest, aForce) {
		if (!aDest)
			throw Error("NS_ERROR_INVALID_ARG");

		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (!this.exists())
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		var rv = JS_LIB_OK;
		try {
			var dest = new JS_FS_File_Path(aDest);
			var copyName, dir = null;

			if (dest.equals(this.mFileInst))
				throw Error("NS_ERROR_FILE_COPY_OR_MOVE_FAILED");

			if (!aForce && dest.exists())
				throw Error("NS_ERROR_FILE_ALREADY_EXISTS");

			if (this.mFileInst.isDirectory())
				throw Error("NS_ERROR_FILE_IS_DIRECTORY");

			if (!dest.exists()) {
				copyName = dest.leafName;
				dir = dest.parent;

				if (!dir.exists())
					throw Error("NS_ERROR_FILE_NOT_FOUND");

				if (!dir.isDirectory())
					throw Error("NS_ERROR_FILE_DESTINATION_NOT_DIR");
			}

			if (!dir) {
				dir = dest;
				if (dest.equals(this.mFileInst))
					throw Error("NS_ERROR_FILE_COPY_OR_MOVE_FAILED");
			}
			this.mFileInst.copyTo(dir, copyName);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* CLOSE ************************************
	 * void close()                                                  *
	 *                                                               *
	 * void file close                                               *
	 * return type void(null)                                        *
	 * takes no arguments closes an open file stream and             *
	 * deletes member var instances of objects                       *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     fopen();                                                  *
	 *     f.close();                                                *
	 *                                                               *
	 *   outputs: void(null)                                         *
	 ****************************************************************/

	close : function () {
		if (this.mFileChannel)   delete this.mFileChannel;
		if (this.mInputStream)   delete this.mInputStream;
		if (this.mTransport)     delete this.mTransport;
		if (this.mMode)          this.mMode = null;

		if (this.mOutStream) {
			this.mOutStream.close();
			delete this.mOutStream;
		}

		if (this.mInputStream) {
			this.mInputStream.close();
			delete this.mInputStream;
		}

		if (this.mLineBuffer) this.mLineBuffer = null;
		this.mPosition = 0;

		if (this.mURI) {
			delete this.mURI;
			this.mURI = null;
		}

		return JS_LIB_OK;
	},

	/**
	 * CREATE
	 */
	create : function () {
		// We can probably implement this so that it can create a
		// file or dir if a long non-existent mPath is present

		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (this.exists())
			throw Error("NS_ERROR_FILE_ALREADY_EXISTS");

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.create(this.JS_FILE_FILE_TYPE, this.JS_FILE_DEFAULT_PERMS);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * CREATEUNIQUE
	 */
	createUnique : function () {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.createUnique(this.JS_FILE_FILE_TYPE, this.JS_FILE_DEFAULT_PERMS);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/**
	 * CLONE
	 */
	clone : function () {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		return new mozimage.utils.File(this.mPath);
	},

	/**
	 * REMOVE
	 */
	remove : function () {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (!this.mPath)
			throw Error("NS_ERROR_FILE_INVALID_PATH");

		if (!this.exists())
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		this.close();

		var rv = JS_LIB_OK;
		try {
			this.mFileInst.remove(false);
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* POS **************************************
	 * int getter POS()                                              *
	 *                                                               *
	 * int file position                                             *
	 * return type int                                               *
	 * takes no arguments needs an open read mode filehandle         *
	 * returns current position, default is 0 set when               *
	 * close is called                                               *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.open();                                                 *
	 *     while(!f.EOF){                                            *
  	 *       dump("pos: "+f.pos+"\n");                               *
  	 *       dump("line: "+f.readline()+"\n");                       *
  	 *     }                                                         *
	 *                                                               *
	 *   outputs: int pos                                            *
	 ****************************************************************/

	get pos() {
		return this.mPosition;
	},

	/********************* SIZE *************************************
	 * int getter size()                                             *
	 *                                                               *
	 * int file size                                                 *
	 * return type int                                               *
	 * takes no arguments a getter only                              *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.size;                                                   *
	 *                                                               *
	 *   outputs: int 16                                             *
	 ****************************************************************/

	get size() {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (!this.mPath)
			throw Error("NS_ERROR_FILE_INVALID_PATH");

		if (!this.exists())
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		this.resetCache();

		var rv;
		try {
			rv = this.mFileInst.fileSize;
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	},

	/********************* EXTENSION ********************************
	 * string getter ext()                                           *
	 *                                                               *
	 * string file extension                                         *
	 * return type string                                            *
	 * takes no arguments a getter only                              *
	 *   Ex:                                                         *
	 *     var p='/tmp/foo.dat';                                     *
	 *     var f=new File(p);                                        *
	 *     f.ext;                                                    *
	 *                                                               *
	 *   outputs: dat                                                *
	 ****************************************************************/

	get ext() {
		if (!this.checkInst())
			throw Error("NS_ERROR_NOT_INITIALIZED");

		if (!this.mPath)
			throw Error("NS_ERROR_FILE_INVALID_PATH");

		if (!this.exists())
			throw Error("NS_ERROR_FILE_NOT_FOUND");

		var rv;
		try {
			var leafName = this.mFileInst.leafName;
			var dotIndex = leafName.lastIndexOf('.');
			rv = (dotIndex >= 0) ? leafName.substring(dotIndex + 1) : "";
		} catch (e) {
			rv = mozimage.logError(e);
		}

		return rv;
	}
});