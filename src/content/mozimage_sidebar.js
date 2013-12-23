include(jslib_dir);
include(jslib_dirutils);
include(jslib_fileutils);
include(jslib_file);
include("chrome://mozimage/content/prefs/mozimage_prefs.js");
include("chrome://global/content/strres.js");

const XMLNS = "http://www.w3.org/XML/1998/namespace";

/*
 **
 ** Private functions
 **
 */

var mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");
var numOfLinks = 0;
var emptyingList = false;

function fileNameCompare(name1, name2) {

	if (name1.leaf.toLowerCase() < name2.leaf.toLowerCase())
		return -1;
	if (name1.leaf.toLowerCase() > name2.leaf.toLowerCase())
		return 1;
	return 0;
}

function fileNameNumCompare(name1, name2) {
	// work with filenames such as: pic1.jpg, pic2.jpg, ..., pic9.jpg, pic10.jpg etc.
	var filenameRe = /^(\D*)(\d*)(.*)$/;
	var fn1 = name1.leaf.toLowerCase();
	var fn2 = name2.leaf.toLowerCase();
	while (fn1 != "" || fn2 != "") {
		var filenameComponents1 = filenameRe.exec(fn1);
		var filenameComponents2 = filenameRe.exec(fn2);
		if (filenameComponents1[1] < filenameComponents2[1]) return -1;
		if (filenameComponents1[1] > filenameComponents2[1]) return 1;
		var rv = filenameComponents1[2] - filenameComponents2[2];
		if (rv != 0) return rv;
		fn1 = filenameComponents1[3];
		fn2 = filenameComponents2[3];
	}
	return 0;
}

function fileCompare(name1, name2) {
	var method = prefs.getOrderBy();
	var descending = (prefs.getDescending() ? -1 : 1);
	switch (method) {
		case "name" :
			return descending * fileNameCompare(name1, name2);
			break;
		case "nume" :
			return descending * fileNameNumCompare(name1, name2);
			break;
		case "date" :
			return descending * (name1.dateModified.getTime() - name2.dateModified.getTime());
			break;
		case "size" :
			return descending * (name1.size - name2.size);
			break;
		default :
			return descending * fileNameCompare(name1, name2);
	}
	return 0;
}

function initializeSearch(url) {
	var fullpath = document.getElementById("fullpath-text");
	var aBrowser = document.getElementById("html-browser");

	aBrowser.addEventListener("load", htmlSearch, true);

	numOfLinks = 0;
	fullpath.value = url;
	aBrowser.setAttribute('src', url);
}

function htmlSearch() {
	try {

		var dirlistbox = document.getElementById("directory-listbox");
		var filelistbox = document.getElementById("file-listbox");
		var aBrowser = document.getElementById("html-browser");
		var doc = aBrowser.contentDocument;
		var fullpath = document.getElementById("fullpath-text");
		var req = null;

		if (doc.links.length > numOfLinks) {
			emptyList();
			numOfLinks = doc.links.length;
			for (var i = 0; i < doc.links.length; i++) {
				if (supportedLinkType(doc.links[i])) {
					filelistbox.appendChild(getImageLinkItem(doc.links[i]));
					// use an XMLHttpRequest object to pre-load the images
					if (prefs.getEnableCache()) {
						req = new XMLHttpRequest();
						req.open('GET', doc.links[i].href, true);
						req.setRequestHeader("Referer", fullpath.value);
						req.send(null);
					}
				}
				else if (doc.links[i].href.substr(0, 7) == "http://")
					dirlistbox.appendChild(getDirectoryItem(doc.links[i]));
			}
		}
	} catch (e) {
		alert(e);
	}
}

function directorySearch(adir) {
	var dirnotfound = mozImageBundle.formatStringFromName("dirnotfound", [], 0);
	var dirlistbox = document.getElementById("directory-listbox");
	var filelistbox = document.getElementById("file-listbox");
	var d = new Dir(adir);
	var dirList = d.readDir();
	if (dirList == null) {
		alert(dirnotfound);
		return;
	}

	var fullpath = document.getElementById("fullpath-text");

	var dirs = new Array();
	var files = new Array();
	var i = 0;
	emptyList();
	fullpath.value = adir;

	for (i = 0; i < dirList.length; i++)
		dirList[i].isDir() ? dirs.push(dirList[i]) : files.push(dirList[i]);

	dirs.sort(fileNameCompare);
	files.sort(fileCompare);

	dirList = new Array();

	for (i = 0; i < dirs.length; i++) {
		var listItem = dirlistbox.appendItem(dirs[i].leaf, '');
		// add the attributes to show right icon
		listItem.setAttribute("class", "listitem-iconic");
		listItem.setAttribute("value", "directory");
	}

	for (i = 0; i < files.length; i++)
		if (supportedType(files[i]))
			filelistbox.appendChild(getFileItem(files[i].leaf));
	if (prefs.getEnableCurrent())
		prefs.setHomeDir(adir);
}

function getDirectoryItem(linkItem) {
	var fullpath = document.getElementById("fullpath-text");
	var listItem = document.createElement('listitem');
	var listCell = document.createElement('listcell');
	var fileLabel = document.createElement('label');
	fileLabel.setAttribute('value', linkItem.href);
	fileLabel.setAttribute('crop', 'center');
	fileLabel.setAttribute('flex', '1');

	listCell.appendChild(fileLabel);
	listItem.appendChild(listCell);
	listItem.setAttribute("class", "listitem-iconic");
	listItem.setAttribute("value", "directory");
	// For compatibility with directoy viewer
	listItem.setAttribute("label", linkItem.href);
	return(listItem);
}

function getAbsoluteURL(url, node) {
	if (!url || !node)
		return "";

	var urlArr = new Array(url);
	var doc = node.ownerDocument;

	if (node.nodeType == Node.ATTRIBUTE_NODE)
		node = node.ownerElement;

	while (node && node.nodeType == Node.ELEMENT_NODE) {
		if (node.getAttributeNS(XMLNS, "base") != "")
			urlArr.unshift(node.getAttributeNS(XMLNS, "base"));

		node = node.parentNode;
	}

	// Look for a <base>.
	var baseTags = doc.getElementsByTagName("base");
	if (baseTags && baseTags.length) {
		urlArr.unshift(baseTags[baseTags.length - 1].getAttribute("href"));
	}

	// resolve everything from bottom up, starting with document location
	var ioService = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	var URL = ioService.newURI(doc.location.href, null, null);
	for (var i = 0; i < urlArr.length; i++) {
		URL.spec = URL.resolve(urlArr[i]);
	}

	return URL.spec;
}

function getImageLinkItem(linkItem) {
	var fullpath = document.getElementById("fullpath-text");
	var listItem = document.createElement('listitem');
	var listCell = document.createElement('listcell');
	var fileLabel = document.createElement('label');

	fileLabel.setAttribute('value', linkItem.href);
	fileLabel.setAttribute('crop', 'center');
	fileLabel.setAttribute('flex', '1');

	if (prefs.getThumbSize() > 0) {
		if (linkItem.firstChild.nodeName.toUpperCase() == 'IMG' || prefs.getForceHttpTumb()) {
			var tumbURL = "";
			var fileImage = document.createElement('image');
			if (linkItem.firstChild.nodeName.toUpperCase() == 'IMG') {
				var image = linkItem.firstChild;
				tumbURL = getAbsoluteURL(image.src, image);
			}
			if (tumbURL == "")
				tumbURL = linkItem.href;
			fileImage.setAttribute('src', tumbURL);
			fileImage.setAttribute('width', prefs.getThumbSize());
			fileImage.setAttribute('height', prefs.getThumbSize());
			listCell.appendChild(fileImage);
		}
	}
	listCell.appendChild(fileLabel);
	listItem.appendChild(listCell);
	listItem.setAttribute('context', 'filelist-popup');
	return(listItem);
}

function getFileItem(fileName) {
	var fullpath = document.getElementById("fullpath-text");
	var fileUtil = new FileUtils();
	var fullFileName = pathToURI(fileUtil.append(fullpath.value, fileName));

	var listItem = document.createElement('listitem');
	var listCell = document.createElement('listcell');
	var fileLabel = document.createElement('label');

	fileLabel.setAttribute('value', fileName);

	if (prefs.getThumbSize() > 0) {
		var fileImage = document.createElement('image');
		fileImage.setAttribute('src', fullFileName);
		fileImage.setAttribute('width', prefs.getThumbSize());
		fileImage.setAttribute('height', prefs.getThumbSize());
		listCell.appendChild(fileImage);
	}

	listCell.appendChild(fileLabel);
	listItem.appendChild(listCell);
	listItem.setAttribute('context', 'filelist-popup');
	return(listItem);
}

function supportedLinkType(linkItem) {
	var result = false;
	var extList = prefs.getExtList();
	for (var i = 0; i < extList.length; i++) {
		if (extList[i].toUpperCase() == linkItem.href.substr(-3).toUpperCase())
			result = true;
	}
	return(result);
}

function supportedType(file) {
	var result = false;
	var extList = prefs.getExtList();
	for (var i = 0; i < extList.length; i++) {
		if (extList[i].toUpperCase() == file.ext.toUpperCase())
			result = true;
	}
	return(result);
}

function emptyList() {
	emptyingList = true;
	var dirlistbox = document.getElementById("directory-listbox");
	var filelistbox = document.getElementById("file-listbox");
	var item;

	var i = dirlistbox.getRowCount();
	while (i > 0) {
		i--;
		item = dirlistbox.getItemAtIndex(i);
		dirlistbox.removeChild(item);
	}
	i = filelistbox.getRowCount();
	while (i > 0) {
		i--;
		item = filelistbox.getItemAtIndex(i);
		filelistbox.removeChild(item);
	}
	emptyingList = false;
}

function selectItemByName(itemName) {
	var fileListBox = document.getElementById("file-listbox");
	var numOfRows = fileListBox.getRowCount();

	for (var i = 0; i < numOfRows; i++) {
		item = fileListBox.getItemAtIndex(i);
		fileListBox.scrollToIndex(i);
		if (item.lastChild.lastChild.value == itemName) {
			fileListBox.selectItem(item);
		}

	}
	fileListBox.ensureIndexIsVisible(fileListBox.selectedIndex);
}


function pathToURI(aPath) {
	const JS_URIFIX = new Components.Constructor("@mozilla.org/docshell/urifixup;1", "nsIURIFixup");
	var uriFixup = new JS_URIFIX();

	var fixedURI = uriFixup.createFixupURI(aPath, 0);
	return(fixedURI.spec);
}

function clearCache() {
	var classID = Components.classes["@mozilla.org/network/cache-service;1"];
	var cacheService = classID.getService(Components.interfaces.nsICacheService);
	cacheService.evictEntries(Components.interfaces.nsICache.STORE_ON_DISK);
	cacheService.evictEntries(Components.interfaces.nsICache.STORE_IN_MEMORY);
}

function getParams(commandLine, imagePath) {
	var params = new Array();
	var index = 0;
	var quote = false;
	var i = 0;
	params[index] = "";
	for (i = 0; i < commandLine.length; i++) {
		if (commandLine[i] == "'")
			quote = !quote;
		else if (commandLine[i] == ' ' && !quote) {
			index++;
			params[index] = "";
		}
		else
			params[index] = params[index] + commandLine[i];
	}
	for (i = 0; i < params.length; i++) {
		if (params[i] == '%f')
			params[i] = imagePath;
	}
	return(params);
}

function saveBookmarks() {
	var bookmarklistbox = document.getElementById("bookmark-listbox");
	var dirUtil = new DirUtils();
	var fileUtil = new FileUtils();
	var fileName = fileUtil.append(dirUtil.getPrefsDir(), 'mozimage-bookmarks.txt');
	var file = new File(fileName);
	var anItem = null;
	file.open('w');
	for (var i = 0; i < bookmarklistbox.getRowCount(); i++) {
		anItem = bookmarklistbox.getItemAtIndex(i);
		file.write(anItem.label + '\n');
		file.write(anItem.value + '\n');
	}
	file.close();
}

function save(url, fileName) {
	var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	var uri = ioservice.newURI(url, null, null);
	var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

	targetFile.initWithPath(fileName);

	if (!targetFile.exists()) {
		targetFile.create(0x00, 0644);
	}
	persist.saveURI(uri, null, null, null, null, targetFile);
}

function baseNameFromUrl(url) {
	var nsIURL = Components.interfaces.nsIURL;
	var urlComp = Components.classes['@mozilla.org/network/standard-url;1'].createInstance(nsIURL);
	urlComp.spec = url;
	return(urlComp.fileName);
}

function getMainImage() {
	return(top.getBrowser().contentDocument.images[0]);
}

/*
 **
 ** Event handler
 **
 */

function exit_click() {
	try {
		var fullpath = document.getElementById("fullpath-text");
		if (prefs.getEnableCurrent()) {
			prefs.setHomeDir(fullpath.value);
			prefs.save();
		}
	} catch (e) {
		alert(e);
	}
	window.close();
}

function image_click() {
	//var image = document.getElementById("main-image");
	//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
	var image = getMainImage();
	image.focus();
}

function save_click() {
	var saveasStr = mozImageBundle.formatStringFromName("saveas", [], 0);
	var fileUtil = new FileUtils();
	//var mainImage = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
	var mainimage = getMainImage();
	//var mainImage = document.getElementById("main-image");
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, saveasStr, nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterImages);
	fp.defaultString = baseNameFromUrl(mainImage.src);
	var res = fp.show();
	if (res == nsIFilePicker.returnOK) {
		var destFile = fp.file;
		try {
			save(mainImage.src, destFile.path);
		} catch (e) {
			alert(e);
		}
	}
}

function saveall_click() {
	var choosedirStr = mozImageBundle.formatStringFromName("choosedir", [], 0);
	var fileUtil = new FileUtils();
	var basePath = document.getElementById("fullpath-text");
	var filelistbox = document.getElementById("file-listbox");
	var item = null;
	var fileName = "";
	var destFile = "";

	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

	fp.init(window, choosedirStr, nsIFilePicker.modeGetFolder);
	fp.appendFilters(nsIFilePicker.filterImages);

	var res = fp.show();
	if (res == nsIFilePicker.returnOK) {
		var destDir = fp.file;
		var uri = "";
		var numOfImages = filelistbox.getRowCount();
		try {
			for (var i = 0; i < numOfImages; i++) {
				item = filelistbox.getItemAtIndex(i);
				fileName = item.lastChild.lastChild.value;
				if (fileName.substr(0, 7) != "http://")
					uri = pathToURI(fileUtil.append(basePath.value, fileName));
				else
					uri = fileName;

				destFile = fileUtil.append(destDir.path, baseNameFromUrl(uri));
				save(uri, destFile);
			}
		}
		catch (e) {
			alert(e);
		}
	}
}

mozimage.define('mozimage.SideBar', {

	init : function (e) {
		var me = this;
		this.sidebar = document.getElementById("mozimage-window");
		this.fullpathText = document.getElementById("fullpath-text");
		this.goButton = document.getElementById("go-button");
		this.priorButton = document.getElementById("prior-button");
		this.nextButton = document.getElementById("next-button");
		this.upButton = document.getElementById("up-button");

		this.autosizeButton = document.getElementById("autosize-button");
		this.zoominButton = document.getElementById("zoomin-button");
		this.zoomoutButton = document.getElementById("zoomout-button");

		mozimage.addEventListener(window, 'unload', this.window_close, this);
		mozimage.addEventListener(this.fullpathText, 'keypress', this.fullpath_keypress, this);
		mozimage.addEventListener(this.goButton, 'command', this.go_click, this);
		mozimage.addEventListener(this.priorButton, 'command', this.prior_click, this);
		mozimage.addEventListener(this.nextButton, 'command', this.next_click, this);
		mozimage.addEventListener(this.upButton, 'command', this.up_click, this);
		mozimage.addEventListener(this.autosizeButton, 'command', this.autosize_click, this);
		mozimage.addEventListener(this.zoominButton, 'command', this.zoomin_click, this);
		mozimage.addEventListener(this.zoomoutButton, 'command', this.zoomout_click, this);

		mozimage.addEventListener('explorer-menu', 'command', this.explorer_click, this);
		mozimage.addEventListener('clear-menu', 'command', this.clear_click, this);
		mozimage.addEventListener('refresh-menu', 'command', this.refresh_click, this);

		mozimage.addEventListener('openwith1-menu', 'command', this.openwith1_click, this);
		mozimage.addEventListener('openwith2-menu', 'command', this.openwith2_click, this);
		mozimage.addEventListener('openwith3-menu', 'command', this.openwith3_click, this);
		mozimage.addEventListener('openwith4-menu', 'command', this.openwith4_click, this);

		mozimage.addEventListener('macro0-menu', 'command', this.macro0_click, this);
		mozimage.addEventListener('macro1-menu', 'command', this.macro1_click, this);
		mozimage.addEventListener('macro2-menu', 'command', this.macro2_click, this);
		mozimage.addEventListener('macro3-menu', 'command', this.macro3_click, this);
		mozimage.addEventListener('macro4-menu', 'command', this.macro4_click, this);
		mozimage.addEventListener('macro5-menu', 'command', this.macro5_click, this);
		mozimage.addEventListener('macro6-menu', 'command', this.macro6_click, this);
		mozimage.addEventListener('macro7-menu', 'command', this.macro7_click, this);
		mozimage.addEventListener('macro8-menu', 'command', this.macro8_click, this);
		mozimage.addEventListener('macro9-menu', 'command', this.macro9_click, this);

		mozimage.addEventListener('edit-button', 'command', this.edit_click, this);
		mozimage.addEventListener('slideshow-button', 'command', this.slideshow_click, this);
		mozimage.addEventListener('options-menu', 'command', this.options_click, this);
		mozimage.addEventListener('about-menu', 'command', this.about_click, this);

		// TODO: keyset doesn't work without the oncommand attrubite
		mozimage.addEventListener('prior-key', 'command', this.prior_click, this);
		mozimage.addEventListener('next-key', 'command', this.next_click, this);
		mozimage.addEventListener('clear-key', 'command', this.clear_click, this);
		mozimage.addEventListener('zoomin-key', 'command', this.zoomin_click, this);
		mozimage.addEventListener('zoomout-key', 'command', this.zoomout_click, this);
		mozimage.addEventListener('autosize-key', 'command', this.autosize_click, this);
		mozimage.addEventListener('slideshow-key', 'command', this.slideshow_click, this);
		mozimage.addEventListener('openwith1-key', 'command', this.openwith1_click, this);
		mozimage.addEventListener('openwith2-key', 'command', this.openwith2_click, this);
		mozimage.addEventListener('openwith3-key', 'command', this.openwith3_click, this);
		mozimage.addEventListener('openwith4-key', 'command', this.openwith4_click, this);

		mozimage.addEventListener('directory-listbox', 'select', this.directory_select, this);

		mozimage.addEventListener('addbookmark-button', 'command', this.addbookmark_click, this);
		mozimage.addEventListener('deletebookmark-button', 'command', this.deletebookmark_click, this);
		mozimage.addEventListener('bookmarkup-button', 'command', this.bookmarkup_click, this);
		mozimage.addEventListener('bookmarkdown-button', 'command', this.bookmarkdown_click, this);

		mozimage.addEventListener('file-listbox', 'select', this.file_select, this);

		this.window_load(e);
	},

	//<editor-fold desc="Event handlers">
	window_load : function (event) {
		try {
			var fullpath = document.getElementById("fullpath-text");
			var autoSizeButton = document.getElementById("autosize-button");
			var aBrowser = document.getElementById("html-browser");
			var startingUrl = "";

			var sidebar = top.document.getElementById("sidebar");
			if (sidebar) {
				startingUrl = sidebar.getAttribute("mozimage_url");
				sidebar.setAttribute("mozimage_url", "");
			}

			autoSizeButton.setAttribute("checked", prefs.getAutoSize());

			this.buildOpenWithMenu();
			this.buildMacroMenu();
			this.loadBookmarks();

			if (startingUrl != "" && fullpath.value != startingUrl)
				this.fillListBox(startingUrl);
			else if (fullpath.value == "")
				this.fillListBox(prefs.getHomeDir());

		} catch (e) {
			mozimage.showError(e);
		}
	},

	window_close : function () {
		var aBrowser = document.getElementById("html-browser");
		prefs.setSlideshow(false);
		prefs.save();
	},

	fullpath_keypress : function (event) {
		jslibDebug("fullpath_keypress >> " + event.keyCode);
		if (event.keyCode == 13) {
			var fullpath = document.getElementById("fullpath-text");
			this.fillListBox(fullpath.value);
		}
	},

	go_click : function (event) {
		try {
			var fullpath = document.getElementById("fullpath-text");
			this.fillListBox(fullpath.value);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	prior_click : function () {
		var fileListBox = document.getElementById("file-listbox");
		var selectedIndex = fileListBox.selectedIndex;
		if (selectedIndex >= 1)
			fileListBox.selectedIndex = selectedIndex - 1;
		else
			fileListBox.selectedIndex = fileListBox.getRowCount() - 1;
		fileListBox.ensureIndexIsVisible(fileListBox.selectedIndex);
	},

	next_click : function () {
		var fileListBox = document.getElementById("file-listbox");
		var selectedIndex = fileListBox.selectedIndex;
		if (selectedIndex >= -1 && selectedIndex < fileListBox.getRowCount() - 1)
			fileListBox.selectedIndex = selectedIndex + 1;
		else
			fileListBox.selectedIndex = 0;
		fileListBox.ensureIndexIsVisible(fileListBox.selectedIndex);
	},

	up_click : function () {
		try {
			var mainTabbox = document.getElementById("main_tabbox");
			mainTabbox.selectedIndex = 0;
			var fullpath = document.getElementById("fullpath-text");
			var fileUtil = new FileUtils();
			if (fullpath.value) {
				var aPath = fullpath.value;
				var file = new File(aPath);
				var aParent = file.parent.path;
				this.fillListBox(aParent);
			}
		} catch (e) {
			// ????
		}
	},

	autosize_click : function () {
		try {
			var autoSizeButton = document.getElementById("autosize-button");
			var mustAutosize = !prefs.getAutoSize();

			prefs.setAutoSize(mustAutosize);
			autoSizeButton.setAttribute('checked', mustAutosize);

			prefs.save();

			top.getBrowser().reload();

		} catch (e) {
			mozimage.showError(e);
		}
	},

	zoomout_click: function () {
		try {
			this.resize(1 / prefs.getZoom());
		} catch (e) {
			mozimage.showError(e);
		}
	},

	zoomin_click : function () {
		try {
			this.resize(prefs.getZoom());
		} catch (e) {
			mozimage.showError(e);
		}
	},

	explorer_click : function () {
		try {
			var choosedir = mozImageBundle.GetStringFromName("choosedir");
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			fp.init(window, choosedir, nsIFilePicker.modeGetFolder);
			var res = fp.show();
			if (res == nsIFilePicker.returnOK) {
				var thepath = fp.file;
				this.fullpathText.value = thepath.path;
				this.fillListBox(thepath.path);
			}
		}
		catch (e) {
			mozimage.showError(e);
		}
	},

	clear_click : function () {
		try {
			var image = getMainImage();
			image.src = "";
			image.width = 0;
			image.height = 0;
			// and stop slide show
			if (prefs.getSlideshow())
				this.slideshow_click();
		} catch (e) {
			mozimage.showError(e);
		}
	},

	refresh_click : function () {
		try {
			var fullpath = document.getElementById("fullpath-text");
			var fileUtil = new FileUtils();
			if (fullpath.value) {
				var aPath = fullpath.value;
				//var file = new File(aPath);
				//var aParent = file.parent.path;
				this.fillListBox(aPath);
			}
		} catch (e) {
			mozimage.showError(e);
		}
	},

	openwith1_click: function () {
		this.openwithEditor(1);
	},

	openwith2_click: function () {
		this.openwithEditor(2);
	},

	openwith3_click: function () {
		this.openwithEditor(3);
	},

	openwith4_click: function () {
		this.openwithEditor(4);
	},

	macro0_click : function () {
		this.runMacro(0)
	},

	macro1_click : function () {
		this.runMacro(1)
	},

	macro2_click : function () {
		this.runMacro(2)
	},

	macro3_click : function () {
		this.runMacro(3)
	},

	macro4_click : function () {
		this.runMacro(4)
	},

	macro5_click : function () {
		this.runMacro(5)
	},

	macro6_click : function () {
		this.runMacro(6)
	},

	macro7_click : function () {
		this.runMacro(7)
	},

	macro8_click : function () {
		this.runMacro(8)
	},

	macro9_click : function () {
		this.runMacro(9)
	},

	edit_click : function () {
		try {
			var chooseImageBefore = mozImageBundle.formatStringFromName("chooseimagebefore", [], 0);
			if (top.getBrowser().contentDocument.location.href
				.toString().substring(0, 7) != "file://") {
				alert(chooseImageBefore);
				return;
			}

			if (top.getBrowser().contentDocument.images[0].src
				.toString().substring(0, 7) != "file://") {
				alert(chooseImageBefore);
				return;
			}

			if (getMainImage() == null) {
				alert(chooseImageBefore);
				return;
			}

			var convertPath = prefs.getConvertPath();
			var editWindow = window.openDialog(
				'chrome://mozimage/content/edit/mozimage_edit.xul',
				mozImageBundle.GetStringFromName("editTitle"),
				'chrome,centerscreen,modal',
				//document.getElementById("main-image"),
				//top.getBrowser().contentDocument.images[0],
				//document.getElementById("file-listbox").selectedItem.lastChild.firstChild,
				getMainImage(),
				mozImageBundle.formatStringFromName("saveas", [], 0),
				document.getElementById("file-listbox"),
				document.getElementById("fullpath-text"),
				mozImageBundle.formatStringFromName("commandnotfound", [], 0),
				convertPath,
				document.getElementById("directory-listbox"),
				top.getBrowser().contentDocument.location.href);

		} catch (e) {
			mozimage.showError(e);
		}
	},

	slideshow_click : function () {
		try {
			var slideshowButton = document.getElementById("slideshow-button");
			var slideshow = !prefs.getSlideshow();

			prefs.setSlideshow(slideshow);
			slideshowButton.setAttribute('checked', slideshow);

			this.doSlideShow();

		} catch (e) {
			mozimage.showError(e);
		}
	},

	options_click : function () {
		try {
			prefs.save();
			window.openDialog('chrome://mozimage/content/prefs/mozimage_prefs.xul', mozImageBundle.GetStringFromName("optionsTitle"), 'chrome,centerscreen,dialog,modal', document.getElementById("fullpath-text"), mozImageBundle.GetStringFromName("choosedir"));
			prefs.load();
			this.buildOpenWithMenu();
			this.buildMacroMenu();
			var fullpath = document.getElementById("fullpath-text");
			this.fillListBox(fullpath.value);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	about_click : function () {
		window.openDialog('chrome://mozimage/content/mozimage_about.xul', 'about', 'chrome,centerscreen,dialog,modal');
	},

	directory_select : function (event) {
		var me = this;
		if (!emptyingList) {
			var selectedItem = event.target.selectedItem;
			var basePath = document.getElementById("fullpath-text");
			var path = selectedItem.getAttribute("label");
			var fileUtil = new FileUtils();
			var url = "";

			if (path.substr(0, 7) == "http://")
				url = path;
			else
				url = fileUtil.append(basePath.value, path);
			// the fillListBox is delayed because probably during its execution it deletes
			// all directory-listbox elements. So, when the code return to this event
			// handler the listboxitem that fire the event don't exists no more and mozilla
			// returns an error.
			setTimeout(function () {
				me.fillListBox.call(me, url.replace(/\\/g, "\\"));
			}, 10);
		}
	},

	addbookmark_click : function () {
		var me = this;
		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var fullpath = document.getElementById("fullpath-text");
		var question = mozImageBundle.formatStringFromName("bookmarkadd", [], 0);
		var bookmarkName = prompt(question, fullpath.value);
		if (bookmarkName != null) {
			var listItem = bookmarklistbox.appendItem(bookmarkName, '');
			// add the attributes to show right icon
			listItem.setAttribute("class", "listitem-iconic");
			listItem.setAttribute("value", fullpath.value);
			listItem.addEventListener("dblclick", function (e) {
				me.bookmark_select.call(me, e);
			}, false);
		}
		saveBookmarks();
	},

	deletebookmark_click : function () {

		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var anItem = bookmarklistbox.currentItem;
		var question = mozImageBundle.formatStringFromName("bookmarkdelete", [anItem.label], 1);

		if (confirm(question)) {
			bookmarklistbox.removeChild(anItem);
		}
		saveBookmarks();
	},

	bookmarkup_click : function () {
		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var item = bookmarklistbox.selectedItem;

		// firstChild does't return a ListItem
		if (item != bookmarklistbox.getItemAtIndex(0)) {
			var prevItem = item.previousSibling;
			bookmarklistbox.removeChild(item);
			bookmarklistbox.insertBefore(item, prevItem);
			bookmarklistbox.selectItem(item);
			saveBookmarks();
		}
	},

	bookmarkdown_click : function () {
		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var item = bookmarklistbox.selectedItem;
		if (item != bookmarklistbox.lastChild) {
			var nextItem = item.nextSibling.nextSibling;
			bookmarklistbox.removeChild(item);
			bookmarklistbox.insertBefore(item, nextItem);
			bookmarklistbox.selectItem(item);
			saveBookmarks();
		}
	},

	file_select : function (event) {
		try {
			if (!emptyingList) {
				var selectedItem = event.target.selectedItem;
				var basePath = document.getElementById("fullpath-text");
				var fileUtil = new FileUtils();

				var labelItem = selectedItem.lastChild.lastChild;
				var fileName = labelItem.value;

				if (fileName.substr(0, 7) != "http://")
					var uri = pathToURI(fileUtil.append(basePath.value, fileName));
				else
					uri = fileName;

				this.showFile(uri);
			}
		} catch (e) {
			mozimage.showError(e);
		}
	},

	bookmark_select : function (event) {
		try {
			var mainTabbox = document.getElementById("main_tabbox");
			mainTabbox.selectedIndex = 0;
			var selectedItem = event.target;
			var path = selectedItem.getAttribute("value");
			this.fillListBox(path);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	//</editor-fold>

	buildOpenWithMenu: function () {
		var editorsName = prefs.getEditorsName();
		for (var i = 1; i <= 4; i++) {
			var openwith = document.getElementById("openwith" + i + "-menu");
			openwith.label = mozImageBundle.formatStringFromName("openwith", [editorsName[i - 1]], 1);
			openwith.hidden = (editorsName[i - 1] == "");
		}
	},

	buildMacroMenu : function() {
		var macroName = prefs.getMacroName();
		for (var i = 0; i < 10; i++) {
			var macromenu = document.getElementById("macro" + i + "-menu");
			macromenu.label = macroName[i];
			macromenu.hidden = (macroName[i] == "");
		}
	},

	loadBookmarks : function () {

		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var dirUtil = new DirUtils();
		var fileUtil = new FileUtils();
		var fileName = fileUtil.append(dirUtil.getPrefsDir(), 'mozimage-bookmarks.txt');
		var file = new File(fileName);

		if (!file.exists()) {
			file.create();
			file.close();
		}
		else {
			file.open("r");
			var bookmarkName = "";
			var bookmarkValue = "";
			while (!file.EOF) {
				bookmarkName = file.readline();
				if (!file.EOF)
					bookmarkValue = file.readline();

				if (bookmarkName != '') {
					var listItem = bookmarklistbox.appendItem(bookmarkName, '');
					// add the attributes to show right icon
					listItem.setAttribute("class", "listitem-iconic");
					listItem.setAttribute("value", bookmarkValue);
					listItem.addEventListener("dblclick", bookmark_select, false);
				}
			}
			file.close();
		}
	},

	fillListBox : function (aLocation) {
		var info = document.getElementById("info-label");
		var loadingStr = mozImageBundle.formatStringFromName("loading", [], 0);
		var readyStr = mozImageBundle.formatStringFromName("ready", [], 0);

		info.value = loadingStr;

		if (aLocation.substr(0, 7) == "http://")
			initializeSearch(aLocation);
		else
			directorySearch(aLocation);

		info.value = readyStr;
	},

	openwithEditor : function (index) {
		var chooseImageBefore = mozImageBundle.formatStringFromName("chooseimagebefore", [], 0);
		var filelistbox = document.getElementById("file-listbox");
		var selectedItem = filelistbox.selectedItem;

		if (selectedItem == null) {
			alert(chooseImageBefore);
			return;
		}

		var labelItem = selectedItem.lastChild.lastChild;
		var fileName = labelItem.value;
		var filenotfound = mozImageBundle.formatStringFromName("filenotfound", [], 0);

		var basePath = document.getElementById("fullpath-text");
		var fileUtil = new FileUtils();
		var editorsPath = prefs.getEditorsPath();
		//var image = document.getElementById("main-image");
		//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
		var image = getMainImage();

		var imagePath = fileUtil.append(basePath.value, fileName);

		try {
			var rv = fileUtil.spawn(editorsPath[index - 1], [imagePath]);
			if (rv == null)
				alert(filenotfound);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	resize : function (ratio) {
		var contentDocument = top.getBrowser().contentDocument;
		if (contentDocument.images.length == 1) {
			if (prefs.getAutoSize())
				this.autosize_click();

			var image = contentDocument.images[0];
			var imageWidth = image.width;
			var imageHeight = image.height;
			image.width = imageWidth * ratio;
			image.height = imageHeight * ratio;
		}
	},

	runMacro : function (index) {
		var chooseImageBefore = mozImageBundle.formatStringFromName("chooseimagebefore", [], 0);
		var filenotfound = mozImageBundle.formatStringFromName("filenotfound", [], 0);
		var filelistbox = document.getElementById("file-listbox");
		var selectedItem = filelistbox.selectedItem;

		if (selectedItem == null) {
			alert(chooseImageBefore);
			return;
		}
		var labelItem = selectedItem.lastChild.lastChild;
		var fileName = labelItem.value;
		var basePath = document.getElementById("fullpath-text");
		var fileUtil = new FileUtils();
		var imagePath = fileUtil.append(basePath.value, fileName);

		//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
		var image = getMainImage();
		var imageURL = image.src;

		var macroCode = prefs.getMacroCode();
		var commandLine = macroCode[index];
		var paramsList = getParams(commandLine, imagePath);
		var paramsOnly = new Array();
		var command = paramsList[0];

		for (var i = 1; i < paramsList.length; i++)
			paramsOnly[i - 1] = paramsList[i];

		try {
			var rv = fileUtil.execute(command, paramsOnly);
			if (rv == null)
				alert(filenotfound);
		} catch (e) {
			mozimage.showError(e);
		}
		var thumbItem = selectedItem.lastChild.firstChild;
		if (thumbItem.nodeName == "image")
			thumbItem.src = "";

		image.src = "";
		this.clearCache();
		image.src = imageURL;

		if (thumbItem.nodeName == "image")
			thumbItem.src = imageURL;
	},

	doSlideShow : function () {
		var me = this;
		if (prefs.getSlideshow()) {
			this.next_click();
			setTimeout(function () {
				me.doSlideShow.call(me)
			}, prefs.getDelay());
		}
	},

	showFile : function (imageURL) {
		var fullpath = document.getElementById("fullpath-text");
		var referrer = null;
		var currentDocument = top.getBrowser().contentDocument;
		var aBrowser = top.getBrowser();

		if (fullpath.value.substr(0, 7) == "http://") {
			referrer = Components.classes["@mozilla.org/network/io-service;1"]
				.getService(Components.interfaces.nsIIOService)
				.newURI(fullpath.value, null, null);
		}
		aBrowser.loadURI(imageURL, referrer, null);
	},

	/*
	updateDescription : function () {
		var image = getMainImage();
		var info = document.getElementById("info-label");
		var newImage = new Image();
		newImage.setAttribute("id", "thepreviewimage");
		newImage.src = image.src;
		info.value = mozImageBundle.formatStringFromName("sizeInfo", [newImage.width, newImage.height], 2);
	}
	*/


});

(function () {
	window.addEventListener('load',function(e) {
		new mozimage.SideBar();
	});
})();