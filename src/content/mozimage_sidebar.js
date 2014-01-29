mozimage.include("chrome://mozimage/content/utils/dir.js");
mozimage.include("chrome://mozimage/content/utils/file.js");
mozimage.include("chrome://mozimage/content/utils/specialDir.js");
mozimage.include("chrome://mozimage/content/utils/fileUtils.js");
mozimage.include("chrome://mozimage/content/prefs/mozimage_prefs.js");

mozimage.comparer = {

	fileNameCompare : function (name1, name2) {

		if (name1.leaf.toLowerCase() < name2.leaf.toLowerCase())
			return -1;
		if (name1.leaf.toLowerCase() > name2.leaf.toLowerCase())
			return 1;
		return 0;
	},

	fileNameNumCompare : function (name1, name2) {
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
	},

	fileCompare : function (name1, name2) {
		var method = mozimage.prefs.getOrderBy();
		var descending = (mozimage.prefs.getDescending() ? -1 : 1);
		switch (method) {
			case "name" :
				return descending * mozimage.comparer.fileNameCompare(name1, name2);
				break;
			case "nume" :
				return descending * mozimage.comparer.fileNameNumCompare(name1, name2);
				break;
			case "date" :
				return descending * (name1.dateModified.getTime() - name2.dateModified.getTime());
				break;
			case "size" :
				return descending * (name1.size - name2.size);
				break;
			default :
				return descending * mozimage.comparer.fileNameCompare(name1, name2);
		}
		return 0;
	}

};

/*
 **
 ** Event handler
 **
 */

/*
function exit_click() {
	try {
		var fullpath = document.getElementById("fullpath-text");
		if (mozimage.prefs.getEnableCurrent()) {
			mozimage.prefs.setHomeDir(fullpath.value);
			mozimage.prefs.save();
		}
	} catch (e) {
		alert(e);
	}
	window.close();
}
*/

/*
function image_click() {
	//var image = document.getElementById("main-image");
	//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
	var image = this.getMainImage();
	image.focus();
}
 */

mozimage.ns("mozimage.ui");

mozimage.ui.SideBar = mozimage.define({

	emptyingList : false,

	numOfLinks : 0,

	stringBundle : null,

	init : function (e) {
		var me = this;
		this.stringBundle = mozimage.getStrBundle("chrome://mozimage/locale/mozimage.properties");
		this.sidebar = document.getElementById("mozimage-window");
		this.fullpathText = document.getElementById("fullpath-text");
		this.goButton = document.getElementById("go-button");
		this.priorButton = document.getElementById("prior-button");
		this.nextButton = document.getElementById("next-button");
		this.upButton = document.getElementById("up-button");

		this.autosizeButton = document.getElementById("autosize-button");
		this.zoominButton = document.getElementById("zoomin-button");
		this.zoomoutButton = document.getElementById("zoomout-button");

		mozimage.bind(window, 'unload', this.window_close, this);
		mozimage.bind(this.fullpathText, 'keypress', this.fullpath_keypress, this);
		mozimage.bind(this.goButton, 'command', this.go_click, this);
		mozimage.bind(this.priorButton, 'command', this.prior_click, this);
		mozimage.bind(this.nextButton, 'command', this.next_click, this);
		mozimage.bind(this.upButton, 'command', this.up_click, this);
		mozimage.bind(this.autosizeButton, 'command', this.autosize_click, this);
		mozimage.bind(this.zoominButton, 'command', this.zoomin_click, this);
		mozimage.bind(this.zoomoutButton, 'command', this.zoomout_click, this);

		mozimage.bind('explorer-menu', 'command', this.explorer_click, this);
		mozimage.bind('clear-menu', 'command', this.clear_click, this);
		mozimage.bind('refresh-menu', 'command', this.refresh_click, this);

		mozimage.bind('openwith1-menu', 'command', this.openwith1_click, this);
		mozimage.bind('openwith2-menu', 'command', this.openwith2_click, this);
		mozimage.bind('openwith3-menu', 'command', this.openwith3_click, this);
		mozimage.bind('openwith4-menu', 'command', this.openwith4_click, this);

		mozimage.bind('macro0-menu', 'command', this.macro0_click, this);
		mozimage.bind('macro1-menu', 'command', this.macro1_click, this);
		mozimage.bind('macro2-menu', 'command', this.macro2_click, this);
		mozimage.bind('macro3-menu', 'command', this.macro3_click, this);
		mozimage.bind('macro4-menu', 'command', this.macro4_click, this);
		mozimage.bind('macro5-menu', 'command', this.macro5_click, this);
		mozimage.bind('macro6-menu', 'command', this.macro6_click, this);
		mozimage.bind('macro7-menu', 'command', this.macro7_click, this);
		mozimage.bind('macro8-menu', 'command', this.macro8_click, this);
		mozimage.bind('macro9-menu', 'command', this.macro9_click, this);

		mozimage.bind('edit-button', 'command', this.edit_click, this);
		mozimage.bind('slideshow-button', 'command', this.slideshow_click, this);
		mozimage.bind('options-menu', 'command', this.options_click, this);
		mozimage.bind('about-menu', 'command', this.about_click, this);

		mozimage.bind('directory-listbox', 'select', this.directory_select, this);

		mozimage.bind('addbookmark-button', 'command', this.addbookmark_click, this);
		mozimage.bind('deletebookmark-button', 'command', this.deletebookmark_click, this);
		mozimage.bind('bookmarkup-button', 'command', this.bookmarkup_click, this);
		mozimage.bind('bookmarkdown-button', 'command', this.bookmarkdown_click, this);

		mozimage.bind('file-listbox', 'select', this.file_select, this);

		mozimage.bind(window, 'keypress', this.window_keypress, this);

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

			autoSizeButton.setAttribute("checked", mozimage.prefs.getAutoSize());

			this.buildOpenWithMenu();
			this.buildMacroMenu();
			this.loadBookmarks();

			if (startingUrl != "" && fullpath.value != startingUrl)
				this.fillListBox(startingUrl);
			else if (fullpath.value == "")
				this.fillListBox(mozimage.prefs.getHomeDir());

		} catch (e) {
			mozimage.showError(e);
		}
	},

	window_close : function () {
		var aBrowser = document.getElementById("html-browser");
		mozimage.prefs.setSlideshow(false);
		mozimage.prefs.save();
	},

	fullpath_keypress : function (event) {
		if (event.keyCode == 13) {
			var fullpath = document.getElementById("fullpath-text");
			this.fillListBox(fullpath.value);
		}
		event.stopPropagation();
	},

	window_keypress : function (event) {
		var c = String.fromCharCode(event.charCode);
		switch(c) {
			case "c":
				this.clear_click();
				break;
			case "b":
				this.prior_click();
				break;
			case "n":
				this.next_click();
				break;
			case "i":
				this.zoomin_click();
				break;
			case "o":
				this.zoomout_click();
				break;
			case "s":
				this.slideshow_click();
				break;
			case "1":
				this.openwith1_click();
				break;
			case "2":
				this.openwith2_click();
				break;
			case "3":
				this.openwith3_click();
				break;
			case "4":
				this.openwith4_click();
				break;
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
			if (fullpath.value) {
				var aPath = fullpath.value;
				var file = new mozimage.utils.File(aPath);
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
			var mustAutosize = !mozimage.prefs.getAutoSize();

			mozimage.prefs.setAutoSize(mustAutosize);
			autoSizeButton.setAttribute('checked', mustAutosize);

			mozimage.prefs.save();

			top.getBrowser().reload();

		} catch (e) {
			mozimage.showError(e);
		}
	},

	zoomout_click: function () {
		try {
			this.resize(1 / mozimage.prefs.getZoom());
		} catch (e) {
			mozimage.showError(e);
		}
	},

	zoomin_click : function () {
		try {
			this.resize(mozimage.prefs.getZoom());
		} catch (e) {
			mozimage.showError(e);
		}
	},

	explorer_click : function () {
		try {
			var choosedir = this.stringBundle.GetStringFromName("choosedir");
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
			var image = this.getMainImage();
			image.src = "";
			image.width = 0;
			image.height = 0;
			// and stop slide show
			if (mozimage.prefs.getSlideshow())
				this.slideshow_click();
		} catch (e) {
			mozimage.showError(e);
		}
	},

	refresh_click : function () {
		try {
			var fullpath = document.getElementById("fullpath-text");
			if (fullpath.value) {
				var aPath = fullpath.value;
				//var file = new mozimage.utils.File(aPath);
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
			throw Error('Not yet supported');
			/*
			var chooseImageBefore = this.stringBundle.formatStringFromName("chooseimagebefore", [], 0);
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

			if (this.getMainImage() == null) {
				alert(chooseImageBefore);
				return;
			}

			var convertPath = mozimage.prefs.getConvertPath();
			var editWindow = window.openDialog(
				'chrome://mozimage/content/edit/mozimage_edit.xul',
				this.stringBundle.GetStringFromName("editTitle"),
				'chrome,centerscreen,modal',
				//document.getElementById("main-image"),
				//top.getBrowser().contentDocument.images[0],
				//document.getElementById("file-listbox").selectedItem.lastChild.firstChild,
				this.getMainImage(),
				this.stringBundle.formatStringFromName("saveas", [], 0),
				document.getElementById("file-listbox"),
				document.getElementById("fullpath-text"),
				this.stringBundle.formatStringFromName("commandnotfound", [], 0),
				convertPath,
				document.getElementById("directory-listbox"),
				top.getBrowser().contentDocument.location.href);
			*/
		} catch (e) {
			mozimage.showError(e);
		}
	},

	slideshow_click : function () {
		try {
			var slideshowButton = document.getElementById("slideshow-button");
			var slideshow = !mozimage.prefs.getSlideshow();

			mozimage.prefs.setSlideshow(slideshow);
			slideshowButton.setAttribute('checked', slideshow);

			this.doSlideShow();

		} catch (e) {
			mozimage.showError(e);
		}
	},

	options_click : function () {
		try {
			mozimage.prefs.save();
			window.openDialog(
				'chrome://mozimage/content/prefs/mozimage_prefs.xul',
				this.stringBundle.GetStringFromName("optionsTitle"),
				'chrome,centerscreen,dialog,modal',
				mozimage
//				document.getElementById("fullpath-text"),
//				this.stringBundle.GetStringFromName("choosedir")
			);
			mozimage.prefs.load();
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
		if (!this.emptyingList) {
			var selectedItem = event.target.selectedItem;
			var basePath = document.getElementById("fullpath-text");
			var path = selectedItem.getAttribute("label");
			var fileUtil = new mozimage.utils.FileUtils();
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
		var question = this.stringBundle.formatStringFromName("bookmarkadd", [], 0);
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
		this.saveBookmarks();
	},

	deletebookmark_click : function () {

		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var anItem = bookmarklistbox.currentItem;
		var question = this.stringBundle.formatStringFromName("bookmarkdelete", [anItem.label], 1);

		if (confirm(question)) {
			bookmarklistbox.removeChild(anItem);
		}
		this.saveBookmarks();
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
			this.saveBookmarks();
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
			this.saveBookmarks();
		}
	},

	file_select : function (event) {
		try {
			if (!this.emptyingList) {
				var selectedItem = event.target.selectedItem;
				var basePath = document.getElementById("fullpath-text");
				var fileUtil = new mozimage.utils.FileUtils();

				var labelItem = selectedItem.lastChild.lastChild;
				var fileName = labelItem.value;

				if (fileName.substr(0, 7) != "http://")
					var uri = this.pathToURI(fileUtil.append(basePath.value, fileName));
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

	htmlSearch : function () {
		try {

			var dirlistbox = document.getElementById("directory-listbox");
			var filelistbox = document.getElementById("file-listbox");
			var aBrowser = document.getElementById("html-browser");
			var doc = aBrowser.contentDocument;
			var fullpath = document.getElementById("fullpath-text");
			var req = null;

			if (doc.links.length > this.numOfLinks) {
				this.emptyList();
				this.numOfLinks = doc.links.length;
				for (var i = 0; i < doc.links.length; i++) {
					if (this.supportedLinkType(doc.links[i])) {
						filelistbox.appendChild(this.getImageLinkItem(doc.links[i]));
						// use an XMLHttpRequest object to pre-load the images
						if (mozimage.prefs.getEnableCache()) {
							req = new XMLHttpRequest();
							req.open('GET', doc.links[i].href, true);
							req.setRequestHeader("Referer", fullpath.value);
							req.send(null);
						}
					}
					else if (doc.links[i].href.substr(0, 7) == "http://")
						dirlistbox.appendChild(this.getDirectoryItem(doc.links[i]));
				}
			}
		} catch (e) {
			mozimage.showError(e);
		}
	},

	/*
	** link to the right click on the image: temporary disabled
	save_click : function () {
		var saveasStr = this.stringBundle.formatStringFromName("saveas", [], 0);
		var fileUtil = new mozimage.utils.FileUtils();
		//var mainImage = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
		var mainimage = this.getMainImage();
		//var mainImage = document.getElementById("main-image");
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

		fp.init(window, saveasStr, nsIFilePicker.modeSave);
		fp.appendFilters(nsIFilePicker.filterImages);
		fp.defaultString = this.baseNameFromUrl(mainImage.src);
		var res = fp.show();
		if (res == nsIFilePicker.returnOK) {
			var destFile = fp.file;
			try {
				this.save(mainImage.src, destFile.path);
			} catch (e) {
				alert(e);
			}
		}
	},
	*/

	/*
	 ** link to the right click on the image: temporary disabled
	saveall_click: function () {
		var choosedirStr = this.stringBundle.formatStringFromName("choosedir", [], 0);
		var fileUtil = new mozimage.utils.FileUtils();
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
						uri = this.pathToURI(fileUtil.append(basePath.value, fileName));
					else
						uri = fileName;

					destFile = fileUtil.append(destDir.path, this.baseNameFromUrl(uri));
					this.save(uri, destFile);
				}
			}
			catch (e) {
				alert(e);
			}
		}
	},
	*/

	//</editor-fold>

	buildOpenWithMenu: function () {
		var editorsName = mozimage.prefs.getEditorsName();
		for (var i = 1; i <= 4; i++) {
			var openwith = document.getElementById("openwith" + i + "-menu");
			openwith.label = this.stringBundle.formatStringFromName("openwith", [editorsName[i - 1]], 1);
			openwith.hidden = (editorsName[i - 1] == "");
		}
	},

	buildMacroMenu : function() {
		var macroName = mozimage.prefs.getMacroName();
		for (var i = 0; i < 10; i++) {
			var macromenu = document.getElementById("macro" + i + "-menu");
			macromenu.label = macroName[i];
			macromenu.hidden = (macroName[i] == "");
		}
	},

	loadBookmarks : function () {
		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var dirUtil = new mozimage.utils.SpecialDir();
		var fileUtil = new mozimage.utils.FileUtils();
		var fileName = fileUtil.append(dirUtil.getPrefsDir(), 'mozimage-bookmarks.txt');
		var file = new mozimage.utils.File(fileName);

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
					mozimage.bind(listItem, 'dblclick', this.bookmark_select, this);
				}
			}
			file.close();
		}
	},

	fillListBox : function (aLocation) {
		var info = document.getElementById("info-label");
		var loadingStr = this.stringBundle.formatStringFromName("loading", [], 0);
		var readyStr = this.stringBundle.formatStringFromName("ready", [], 0);

		info.value = loadingStr;

		if (aLocation.substr(0, 7) == "http://")
			this.initializeSearch(aLocation);
		else
			this.directorySearch(aLocation);

		info.value = readyStr;
	},

	openwithEditor : function (index) {
		var chooseImageBefore = this.stringBundle.formatStringFromName("chooseimagebefore", [], 0);
		var filelistbox = document.getElementById("file-listbox");
		var selectedItem = filelistbox.selectedItem;

		if (selectedItem == null) {
			alert(chooseImageBefore);
			return;
		}

		var labelItem = selectedItem.lastChild.lastChild;
		var fileName = labelItem.value;
		var filenotfound = this.stringBundle.formatStringFromName("filenotfound", [], 0);

		var basePath = document.getElementById("fullpath-text");
		var fileUtil = new mozimage.utils.FileUtils();
		var editorsPath = mozimage.prefs.getEditorsPath();
		//var image = document.getElementById("main-image");
		//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
		var image = this.getMainImage();

		var imagePath = fileUtil.append(basePath.value, fileName);

		try {
			fileUtil.run(editorsPath[index - 1], [imagePath]);
		} catch (e) {
			mozimage.showError(e);
		}
	},

	resize : function (ratio) {
		var contentDocument = top.getBrowser().contentDocument;
		if (contentDocument.images.length == 1) {
			if (mozimage.prefs.getAutoSize())
				this.autosize_click();

			var image = contentDocument.images[0];
			var imageWidth = image.width;
			var imageHeight = image.height;
			image.width = imageWidth * ratio;
			image.height = imageHeight * ratio;
		}
	},

	runMacro : function (index) {
		var chooseImageBefore = this.stringBundle.formatStringFromName("chooseimagebefore", [], 0);
		var filenotfound = this.stringBundle.formatStringFromName("filenotfound", [], 0);
		var filelistbox = document.getElementById("file-listbox");
		var selectedItem = filelistbox.selectedItem;

		if (selectedItem == null) {
			alert(chooseImageBefore);
			return;
		}
		var labelItem = selectedItem.lastChild.lastChild;
		var fileName = labelItem.value;
		var basePath = document.getElementById("fullpath-text");
		var fileUtil = new mozimage.utils.FileUtils();
		var imagePath = fileUtil.append(basePath.value, fileName);

		//var image = document.getElementById("file-listbox").selectedItem.lastChild.firstChild;
		var image = this.getMainImage();
		var imageURL = image.src;

		var macroCode = mozimage.prefs.getMacroCode();
		var commandLine = macroCode[index];
		var paramsList = this.getParams(commandLine, imagePath);
		var paramsOnly = new Array();
		var command = paramsList[0];

		for (var i = 1; i < paramsList.length; i++)
			paramsOnly[i - 1] = paramsList[i];

		try {
			fileUtil.run(command, paramsOnly);
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
		if (mozimage.prefs.getSlideshow()) {
			this.next_click();
			setTimeout(function () {
				me.doSlideShow.call(me)
			}, mozimage.prefs.getDelay());
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

	initializeSearch : function (url) {
		var fullpath = document.getElementById("fullpath-text");
		var aBrowser = document.getElementById("html-browser");

		mozimage.bind(aBrowser, "load", this.htmlSearch, this);

		this.numOfLinks = 0;
		fullpath.value = url;
		aBrowser.setAttribute('src', url);
	},

	directorySearch : function (adir) {
		var dirnotfound = this.stringBundle.formatStringFromName("dirnotfound", [], 0);
		var dirlistbox = document.getElementById("directory-listbox");
		var filelistbox = document.getElementById("file-listbox");
		var d = new mozimage.utils.Dir(adir);
		var dirList = d.readDir();
		if (dirList == null) {
			alert(dirnotfound);
			return;
		}

		var fullpath = document.getElementById("fullpath-text");

		var dirs = new Array();
		var files = new Array();
		var i = 0;
		this.emptyList();
		fullpath.value = adir;

		for (i = 0; i < dirList.length; i++)
			dirList[i].isDir() ? dirs.push(dirList[i]) : files.push(dirList[i]);

		dirs.sort(mozimage.comparer.fileNameCompare);
		files.sort(mozimage.comparer.fileCompare);

		dirList = new Array();

		for (i = 0; i < dirs.length; i++) {
			var listItem = dirlistbox.appendItem(dirs[i].leaf, '');
			// add the attributes to show right icon
			listItem.setAttribute("class", "listitem-iconic");
			listItem.setAttribute("value", "directory");
		}

		for (i = 0; i < files.length; i++)
			if (this.supportedType(files[i]))
				filelistbox.appendChild(this.getFileItem(files[i].leaf));
		if (mozimage.prefs.getEnableCurrent())
			mozimage.prefs.setHomeDir(adir);
	},

	getDirectoryItem : function (linkItem) {
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
	},

	getAbsoluteURL : function (url, node) {
		const XMLNS = "http://www.w3.org/XML/1998/namespace";

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
	},

	getImageLinkItem : function (linkItem) {
		var fullpath = document.getElementById("fullpath-text");
		var listItem = document.createElement('listitem');
		var listCell = document.createElement('listcell');
		var fileLabel = document.createElement('label');

		fileLabel.setAttribute('value', linkItem.href);
		fileLabel.setAttribute('crop', 'center');
		fileLabel.setAttribute('flex', '1');

		if (mozimage.prefs.getThumbSize() > 0) {
			if (linkItem.firstChild.nodeName.toUpperCase() == 'IMG' || mozimage.prefs.getForceHttpTumb()) {
				var tumbURL = "";
				var fileImage = document.createElement('image');
				if (linkItem.firstChild.nodeName.toUpperCase() == 'IMG') {
					var image = linkItem.firstChild;
					tumbURL = this.getAbsoluteURL(image.src, image);
				}
				if (tumbURL == "")
					tumbURL = linkItem.href;
				fileImage.setAttribute('src', tumbURL);
				fileImage.setAttribute('width', mozimage.prefs.getThumbSize());
				fileImage.setAttribute('height', mozimage.prefs.getThumbSize());
				listCell.appendChild(fileImage);
			}
		}
		listCell.appendChild(fileLabel);
		listItem.appendChild(listCell);
		listItem.setAttribute('context', 'filelist-popup');
		return(listItem);
	},

	getFileItem : function (fileName) {
		var fullpath = document.getElementById("fullpath-text");
		var fileUtil = new mozimage.utils.FileUtils();
		var fullFileName = this.pathToURI(fileUtil.append(fullpath.value, fileName));

		var listItem = document.createElement('listitem');
		var listCell = document.createElement('listcell');
		var fileLabel = document.createElement('label');

		fileLabel.setAttribute('value', fileName);

		if (mozimage.prefs.getThumbSize() > 0) {
			var fileImage = document.createElement('image');
			fileImage.setAttribute('src', fullFileName);
			fileImage.setAttribute('width', mozimage.prefs.getThumbSize());
			fileImage.setAttribute('height', mozimage.prefs.getThumbSize());
			listCell.appendChild(fileImage);
		}

		listCell.appendChild(fileLabel);
		listItem.appendChild(listCell);
		listItem.setAttribute('context', 'filelist-popup');
		return(listItem);
	},

	supportedLinkType : function (linkItem) {
		var result = false;
		var extList = mozimage.prefs.getExtList();
		for (var i = 0; i < extList.length; i++) {
			if (extList[i].toUpperCase() == linkItem.href.substr(-3).toUpperCase())
				result = true;
		}
		return(result);
	},

	supportedType : function (file) {
		var result = false;
		var extList = mozimage.prefs.getExtList();
		for (var i = 0; i < extList.length; i++) {
			if (extList[i].toUpperCase() == file.ext.toUpperCase())
				result = true;
		}
		return(result);
	},

	emptyList : function () {
		this.emptyingList = true;
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
		this.emptyingList = false;
	},

	/*
	selectItemByName : function (itemName) {
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
	},
	*/

	pathToURI : function (aPath) {
		const JS_URIFIX = new Components.Constructor("@mozilla.org/docshell/urifixup;1", "nsIURIFixup");
		var uriFixup = new JS_URIFIX();

		var fixedURI = uriFixup.createFixupURI(aPath, 0);
		return(fixedURI.spec);
	},

	clearCache : function () {
		var classID = Components.classes["@mozilla.org/network/cache-service;1"];
		var cacheService = classID.getService(Components.interfaces.nsICacheService);
		cacheService.evictEntries(Components.interfaces.nsICache.STORE_ON_DISK);
		cacheService.evictEntries(Components.interfaces.nsICache.STORE_IN_MEMORY);
	},

	getParams : function (commandLine, imagePath) {
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
	},

	saveBookmarks : function () {
		var bookmarklistbox = document.getElementById("bookmark-listbox");
		var dirUtil = new mozimage.utils.SpecialDir()();
		var fileUtil = new mozimage.utils.FileUtils();
		var fileName = fileUtil.append(dirUtil.getPrefsDir(), 'mozimage-bookmarks.txt');
		var file = new mozimage.utils.File(fileName);
		var anItem = null;
		file.open('w');
		for (var i = 0; i < bookmarklistbox.getRowCount(); i++) {
			anItem = bookmarklistbox.getItemAtIndex(i);
			file.write(anItem.label + '\n');
			file.write(anItem.value + '\n');
		}
		file.close();
	},

	/*
	save : function (url, fileName) {
		var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var uri = ioservice.newURI(url, null, null);
		var persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Components.interfaces.nsIWebBrowserPersist);
		var targetFile = new mozimage.utils.File(fileName);

		if (!targetFile.exists()) {
			targetFile.create(0x00, 0644);
		}
		var context = ????;
		persist.saveURI(uri, null, null, null, null, targetFile, context);
	},
	*/

	baseNameFromUrl : function (url) {
		var nsIURL = Components.interfaces.nsIURL;
		var urlComp = Components.classes['@mozilla.org/network/standard-url;1'].createInstance(nsIURL);
		urlComp.spec = url;
		return(urlComp.fileName);
	},

	getMainImage : function () {
		return(top.getBrowser().contentDocument.images[0]);
	}

/*
updateDescription : function () {
	var image = getMainImage();
	var info = document.getElementById("info-label");
	var newImage = new Image();
	newImage.setAttribute("id", "thepreviewimage");
	newImage.src = image.src;
	info.value = this.stringBundle.formatStringFromName("sizeInfo", [newImage.width, newImage.height], 2);
}
*/


});

(function () {
	window.addEventListener('load',function(e) {
		new mozimage.ui.SideBar();
	});
})();