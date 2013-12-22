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

function showFile(imageURL) {
	try {

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

	} catch (e) {
		alert(e);
	}
}

function resize(ratio) {
	var contentDocument = top.getBrowser().contentDocument;
	if (contentDocument.images.length == 1) {
		if (prefs.getAutoSize())
			autosize_click();

		var image = contentDocument.images[0];
		imageWidth = image.width;
		imageHeight = image.height;
		image.width = imageWidth * ratio;
		image.height = imageHeight * ratio;
	}
}

function updateDescription() {
	var image = getMainImage();
	var info = document.getElementById("info-label");
	var newImage = new Image();
	newImage.setAttribute("id", "thepreviewimage");
	newImage.src = image.src;
	info.value = mozImageBundle.formatStringFromName("sizeInfo", [newImage.width, newImage.height], 2);
}

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

function fillListBox(aLocation) {
	var info = document.getElementById("info-label");
	var loadingStr = mozImageBundle.formatStringFromName("loading", [], 0);
	var readyStr = mozImageBundle.formatStringFromName("ready", [], 0);

	info.value = loadingStr;

	if (aLocation.substr(0, 7) == "http://")
		initializeSearch(aLocation);
	else
		directorySearch(aLocation);

	info.value = readyStr;
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

function doSlideShow() {
	if (prefs.getSlideshow()) {
		next_click();
		setTimeout(doSlideShow, prefs.getDelay());
	}
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

function buildOpenWithMenu() {

	var editorsName = prefs.getEditorsName();
	for (var i = 1; i <= 4; i++) {
		var openwith = document.getElementById("openwith" + i + "-menu");
		openwith.label = mozImageBundle.formatStringFromName("openwith", [editorsName[i - 1]], 1);
		openwith.hidden = (editorsName[i - 1] == "");
	}
}

function buildMacroMenu() {
	var macroName = prefs.getMacroName();
	for (var i = 0; i < 10; i++) {
		var macromenu = document.getElementById("macro" + i + "-menu");
		macromenu.label = macroName[i];
		macromenu.hidden = (macroName[i] == "");
	}
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

function loadBookmarks() {
	try {

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
					//listItem.setAttribute("ondblclick", "bookmark_select(event);");
					listItem.addEventListener("dblclick", bookmark_select, false);
				}
			}
			file.close();
		}

	} catch (e) {
		alert(e);
	}
}

function bookmarkup_click() {
	var bookmarklistbox = document.getElementById("bookmark-listbox");
	var item = bookmarklistbox.selectedItem;

	// firstChild does't return a ListItem
	if (item != bookmarklistbox.getItemAtIndex(0)) {
		prevItem = item.previousSibling;
		bookmarklistbox.removeChild(item);
		bookmarklistbox.insertBefore(item, prevItem);
		bookmarklistbox.selectItem(item);
		saveBookmarks();
	}
}

function bookmarkdown_click() {
	var bookmarklistbox = document.getElementById("bookmark-listbox");
	var item = bookmarklistbox.selectedItem;
	if (item != bookmarklistbox.lastChild) {
		nextItem = item.nextSibling.nextSibling;
		bookmarklistbox.removeChild(item);
		bookmarklistbox.insertBefore(item, nextItem);
		bookmarklistbox.selectItem(item);
		saveBookmarks();
	}
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

function window_load(event) {
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

		buildOpenWithMenu();
		buildMacroMenu();
		loadBookmarks();

		if (startingUrl != "" && fullpath.value != startingUrl)
			fillListBox(startingUrl);
		else if (fullpath.value == "")
			fillListBox(prefs.getHomeDir());

	} catch (e) {
		alert(e);
	}
}

function window_close(event) {
	var aBrowser = document.getElementById("html-browser");
	prefs.setSlideshow(false);
	prefs.save();
}

function about_click() {
	window.openDialog('chrome://mozimage/content/mozimage_about.xul', 'about', 'chrome,centerscreen,dialog,modal');
}

function options_click() {
	try {
		prefs.save();
		window.openDialog('chrome://mozimage/content/prefs/mozimage_prefs.xul', mozImageBundle.GetStringFromName("optionsTitle"), 'chrome,centerscreen,dialog,modal', document.getElementById("fullpath-text"), mozImageBundle.GetStringFromName("choosedir"));
		prefs.load();
		buildOpenWithMenu();
		buildMacroMenu();
		var fullpath = document.getElementById("fullpath-text");
		fillListBox(fullpath.value);
	} catch (e) {
		alert(e);
	}
}

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

function autosize_click() {
	try {
		var autoSizeButton = document.getElementById("autosize-button");
		var mustAutosize = !prefs.getAutoSize();

		prefs.setAutoSize(mustAutosize);
		autoSizeButton.setAttribute('checked', mustAutosize);

		prefs.save();

		top.getBrowser().reload();

	} catch (e) {
		alert(e);
	}
}

function zoomout_click() {
	try {
		resize(1 / prefs.getZoom());
	} catch (e) {
		alert(e);
	}
}

function zoomin_click() {
	try {
		resize(prefs.getZoom());
	} catch (e) {
		alert(e);
	}
}

function edit_click() {
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
		alert(e);
	}
}

function slideshow_click() {
	try {
		var slideshowButton = document.getElementById("slideshow-button");
		var slideshow = !prefs.getSlideshow();

		prefs.setSlideshow(slideshow);
		slideshowButton.setAttribute('checked', slideshow);

		doSlideShow();

	} catch (e) {
		alert(e);
	}
}

function image_click() {
	//var image = document.getElementById("main-image");
	//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
	var image = getMainImage();
	image.focus();
}

function clear_click() {
	try {
		var image = getMainImage();
		image.src = "";
		image.width = 0;
		image.height = 0;
		// and stop slide show
		if (prefs.getSlideshow())
			slideshow_click();
	} catch (e) {
		alert(e);
	}
}

function prior_click() {
	var fileListBox = document.getElementById("file-listbox");
	var selectedIndex = fileListBox.selectedIndex;
	if (selectedIndex >= 1)
		fileListBox.selectedIndex = selectedIndex - 1;
	else
		fileListBox.selectedIndex = fileListBox.getRowCount() - 1;
	fileListBox.ensureIndexIsVisible(fileListBox.selectedIndex);
}

function next_click() {
	var fileListBox = document.getElementById("file-listbox");
	var selectedIndex = fileListBox.selectedIndex;
	if (selectedIndex >= -1 && selectedIndex < fileListBox.getRowCount() - 1)
		fileListBox.selectedIndex = selectedIndex + 1;
	else
		fileListBox.selectedIndex = 0;
	fileListBox.ensureIndexIsVisible(fileListBox.selectedIndex);
}

function refresh_click() {
	try {
		var fullpath = document.getElementById("fullpath-text");
		var fileUtil = new FileUtils();
		if (fullpath.value) {
			var aPath = fullpath.value;
			//var file = new File(aPath);
			//var aParent = file.parent.path;
			fillListBox(aPath);
		}
	} catch (e) {
		alert(e);
	}
}

function up_click() {
	try {
		var mainTabbox = document.getElementById("main_tabbox");
		mainTabbox.selectedIndex = 0;
		var fullpath = document.getElementById("fullpath-text");
		var fileUtil = new FileUtils();
		if (fullpath.value) {
			var aPath = fullpath.value;
			var file = new File(aPath);
			var aParent = file.parent.path;
			fillListBox(aParent);
		}
	} catch (e) {
	}
}

function go_click(event) {
	try {
		var fullpath = document.getElementById("fullpath-text");
		fillListBox(fullpath.value);
	} catch (e) {
		alert(e);
	}
}

function directory_select(event) {
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
		setTimeout("fillListBox('" + url.replace(/\\/g, "\\\\") + "')", 10);
	}
}

function bookmark_select(event) {
	try {
		var mainTabbox = document.getElementById("main_tabbox");
		mainTabbox.selectedIndex = 0;
		var selectedItem = event.target;
		var path = selectedItem.getAttribute("value");
		fillListBox(path);
	} catch (e) {
		alert(e);
	}

}

function addbookmark_click() {
	var bookmarklistbox = document.getElementById("bookmark-listbox");
	var fullpath = document.getElementById("fullpath-text");
	var question = mozImageBundle.formatStringFromName("bookmarkadd", [], 0);
	var bookmarkName = prompt(question, fullpath.value);
	if (bookmarkName != null) {
		var listItem = bookmarklistbox.appendItem(bookmarkName, '');
		// add the attributes to show right icon
		listItem.setAttribute("class", "listitem-iconic");
		listItem.setAttribute("value", fullpath.value);
		listItem.addEventListener("dblclick", bookmark_select, false);
	}
	saveBookmarks();
}

function deletebookmark_click() {

	var bookmarklistbox = document.getElementById("bookmark-listbox");
	var anItem = bookmarklistbox.currentItem;
	var question = mozImageBundle.formatStringFromName("bookmarkdelete", [anItem.label], 1);

	if (confirm(question)) {
		bookmarklistbox.removeChild(anItem);
	}
	saveBookmarks();
}

function file_select(event) {
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

		showFile(uri);
	}
}

function openwith_click(index) {
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
		alert(e);
	}
}

function macro_click(index) {
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
		alert(e);
	}
	var thumbItem = selectedItem.lastChild.firstChild;
	if (thumbItem.nodeName == "image")
		thumbItem.src = "";

	image.src = "";
	clearCache();
	image.src = imageURL;

	if (thumbItem.nodeName == "image")
		thumbItem.src = imageURL;
}

function fullpath_keypress(e) {
	if (e.keyCode == 13) {
		var fullpath = document.getElementById("fullpath-text");
		fillListBox(fullpath.value);
	}
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

function explorer_click() {
	try {
		var choosedir = mozImageBundle.GetStringFromName("choosedir");
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, choosedir, nsIFilePicker.modeGetFolder);
		var res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var thepath = fp.file;
			document.getElementById('fullpath-text').value = thepath.path;
			fillListBox(thepath.path);
		}
	}
	catch (e) {
		alert(e);
	}
}

