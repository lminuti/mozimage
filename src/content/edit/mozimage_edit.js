/* AUTHOR: My Hoang my.hoang@linbox.com */

include(jslib_dirutils);
//include (jslib_prefs);
include(jslib_fileutils);
include(jslib_file);
include(jslib_dir);

include("chrome://mozimage/content/prefs/mozimage_prefs.js");
include("chrome://global/content/strres.js");

const XMLNS = "http://www.w3.org/XML/1998/namespace";

var mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");
var onceSavedErase = false;
var onceSavedNew = false;
var changedFlag = -1;
var inPerform = 0;
var commandLineArray = new Array();
//var nbUndo = 0;
//var nbUndoMax = 0;
//const UNDOMAX = 2;
var undoFlag = -1;

var imageName = returnImageName();
var imagePath = returnImagePath();
var imageSrc = returnImageSrc();
var imagePathArray = returnImagePathArray();
var imageNameArray = returnImageNameArray();
var imageSrcArray = returnImageSrcArray();
/*var tmpPath = imagePathArray[0] + ".mozimagetmp" + imagePathArray[1];
 var bakPath = imagePathArray[0] + ".mozimagebak" + imagePathArray[1];
 var tmpName = imageNameArray[0] + ".mozimagetmp" + imageNameArray[1];
 var bakName = imageNameArray[0] + ".mozimagebak" + imageNameArray[1];
 var tmpSrc = imageSrcArray[0] + ".mozimagetmp" + imageSrcArray[1];
 var bakSrc = imageSrcArray[0] + ".mozimagebak" + imageSrcArray[1];*/
var tmpPath = imagePathArray[0] + imagePathArray[1] + ".mozimagetmp";
var bakPath = imagePathArray[0] + imagePathArray[1] + ".mozimagebak";
var lastPath = imagePathArray[0] + imagePathArray[1] + ".mozimagelast";
var tmpName = imageNameArray[0] + imageNameArray[1] + ".mozimagetmp";
var bakName = imageNameArray[0] + imageNameArray[1] + ".mozimagebak";
var lastName = imageNameArray[0] + imageNameArray[1] + ".mozimagelast";
var tmpSrc = imageSrcArray[0] + imageSrcArray[1] + ".mozimagetmp";
var bakSrc = imageSrcArray[0] + imageSrcArray[1] + ".mozimagebak";
var lastSrc = imageSrcArray[0] + imageSrcArray[1] + ".mozimagelast";

var convertPath = window.arguments[5];
//var tmpImage = document.getElementById("edit-tmp-image");
//var bakImage = document.getElementById("edit-bak-image");
var tmpImage;
var bakImage;
var lastImage;

/*********************************************************************/

function edit_load(event) {
	tmpImage = document.getElementById("edit-tmp-image");
	bakImage = document.getElementById("edit-bak-image");

	//alert(imagePath + "\n" + imageName + "\n" + imageSrc);

	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	targetFile.initWithPath(tmpPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(bakPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(lastPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(imagePath);
	targetFile.copyTo(null, tmpName);
	targetFile.copyTo(null, bakName);
	targetFile.copyTo(null, lastName);
	drawChangedImage(-1, -1);


	advanced_check();

	resize_listener();
	rotate_listener();
	drawtext_listener();
	effects_listener();
	enhance_listener();
	quality_listener();
}

function edit_cancel(event) {
	if (event.type == "dialogcancel") {
		alert(event.cancelable);
		event.preventDefault();
		return;
	}
}

function edit_close(event) {
	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
		.getService(Components.interfaces.nsIPromptService);
	var flags = promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_0 +
		promptService.BUTTON_TITLE_CANCEL * promptService.BUTTON_POS_1 +
		promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_2;
	var confirmquit = mozImageBundle.formatStringFromName("confirmquit", [], 0);
	var savebeforequit = mozImageBundle.formatStringFromName("savebeforequit", [], 0);
	var savecurrentas = mozImageBundle.formatStringFromName("savecurrentas", [], 0);
	var quitwithoutsave = mozImageBundle.formatStringFromName("quitwithoutsave", [], 0);

	var confirmValue;

	if (changedFlag == 1) {
		confirmValue = promptService.confirmEx(window, confirmquit,
			savebeforequit,
			flags, quitwithoutsave, null, savecurrentas, null, {});
	}
	else {
		confirmValue = 0;
	}

	if (confirmValue == 2) {
		save_changed_image();
	}
	else if (confirmValue == 1) {
		return;
	}
	else if (confirmValue == 0) {
		edit_exit();
	}
	if (confirmValue == 2) {
		edit_exit();
	}
}

function edit_exit() {
	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

	targetFile.initWithPath(lastPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(tmpPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(bakPath);
	if (targetFile.exists() == true) targetFile.remove(false);

	//var filelistbox = window.arguments[2];
	//var selectedItem = filelistbox.selectedItem;
	var image = window.arguments[0];
	var imageURL = image.src;
	//var thumbItem = selectedItem.lastChild.firstChild;
	//if (thumbItem.nodeName == "image")
	//	thumbItem.src = "";
	image.src = "";
	clearCache();
	image.src = imageURL;
	//if (thumbItem.nodeName == "image")
	//	thumbItem.src = imageURL;

	//if (onceSavedErase == true) { directorySearch(window.arguments[3].value); showFile(image.src); }
	//if (onceSavedNew == true) {  directorySearch(window.arguments[3].value); }
	try {
		window.opener.refresh_click();
	} catch (e) {
		alert(e)
	}
	window.close();
}


//window.close = function () { this.close();  }

/*********************************************************************/

/* Return Image TmpImage, BakImage Path, Name and Src */

function returnImagePath() {
	imagePathToReturn = window.arguments[7].toString().substring(7);
	if (navigator.platform == "Win32") {
		var slashReg = new RegExp("/", "gi");
		var imagePathToReturn = imagePathToReturn.toString()
			.replace(slashReg, "\\");
		slashReg = new RegExp("%20", "gi");
		imagePathToReturn = imagePathToReturn.toString()
			.replace(slashReg, " ");
		if (imagePathToReturn.charAt(0) == "\\") {
			imagePathToReturn = imagePathToReturn.substring(1);
		}
	}
	return(imagePathToReturn);
}

function returnImageName() {
	var lastPoint;
	lastPoint = window.arguments[7].toString().lastIndexOf("/");
	return(window.arguments[7].toString().substring(lastPoint + 1));
}

function returnImageSrc() {
	return (window.arguments[0].src);
}

function returnImagePathArray() {
	imagePathToReturn = window.arguments[7].toString().substring(7);
	if (navigator.platform == "Win32") {
		var slashReg = new RegExp("/", "gi");
		var imagePathToReturn = imagePathToReturn.toString()
			.replace(slashReg, "\\");
		slashReg = new RegExp("%20", "gi");
		imagePathToReturn = imagePathToReturn.toString()
			.replace(slashReg, " ");
		if (imagePathToReturn.charAt(0) == "\\") {
			imagePathToReturn = imagePathToReturn.substring(1);
		}
	}
	imagePath = imagePathToReturn;
	var imagePathArray = new Array();
	var lastPoint = imagePath.lastIndexOf(".");
	imagePathArray[0] = imagePath.substring(0, lastPoint);
	imagePathArray[1] = imagePath.substring(lastPoint);
	return (imagePathArray);
}

function returnImageNameArray() {
	var lastPoint;
	lastPoint = window.arguments[7].toString().lastIndexOf("/");
	var imageName = window.arguments[7].toString().substring(lastPoint + 1);
	var imageNameArray = new Array();
	lastPoint = imageName.lastIndexOf(".");
	imageNameArray[0] = imageName.substring(0, lastPoint);
	imageNameArray[1] = imageName.substring(lastPoint);
	return (imageNameArray);
}

function returnImageSrcArray() {
	var imageSrc = window.arguments[0].src;
	var lastPoint = imageSrc.lastIndexOf(".");
	var imageSrcArray = new Array();
	imageSrcArray[0] = imageSrc.substring(0, lastPoint);
	imageSrcArray[1] = imageSrc.substring(lastPoint);
	return (imageSrcArray);
}

/*********************************************************************/

/* Update Description */

function updateDescription(info, x, y) {
	if (x == -1 && y == -1)
		info.value = "";
	else
		info.value = mozImageBundle.formatStringFromName("sizeInfo", [x + "px", y + "px"], 2);
}

function updateCoord(info, x, y) {
	if (x == -1 && y == -1)
		info.value = " ";
	else
		info.value = mozImageBundle.formatStringFromName("coordInfo", [x + "px", y + "px"], 2);
}

/*********************************************************************/

/*  Resize */

function resize_listener() {
	var scrollX = document.getElementById("edit-resize-x-scroll");
	var scrollY = document.getElementById("edit-resize-y-scroll");
	scrollX.addEventListener("DOMAttrModified", resize_scroll_x, false);
	scrollY.addEventListener("DOMAttrModified", resize_scroll_y, false);
}

function resize_scroll_x() {
	var checkPix = document.getElementById("pixel-radio");
	var checkPer = document.getElementById("percent-radio");
	var checkRatio = document.getElementById("edit-resize-ratio-check");
	var scrollX = document.getElementById("edit-resize-x-scroll");
	var scrollY = document.getElementById("edit-resize-y-scroll");
	var scrollXpos = document.getElementById("edit-resize-x-scroll").getAttribute("curpos");
	var scrollYpos = document.getElementById("edit-resize-y-scroll").getAttribute("curpos");
	var newWidth = tmpImage.boxObject.width / 100 * scrollXpos;
	var newParseWidth = parseInt(newWidth, 10);
	var newHeight = tmpImage.boxObject.height / 100 * scrollYpos;
	var newParseHeight = parseInt(newHeight, 10);
	var textX = document.getElementById("edit-resize-x-text");
	var textY = document.getElementById("edit-resize-y-text");
	if (checkRatio.checked == true) {
		scrollY.setAttribute("curpos", scrollXpos);
	}
	if (checkPix.selected == true) {
		textX.value = newParseWidth;
		if (checkRatio.checked == true)
			textY.value = newParseHeight;
		updateDescription(document.getElementById("edit-resize-info-des"), -1, -1);
	}
	if (checkPer.selected == true) {
		textX.value = document.getElementById("edit-resize-x-scroll").getAttribute("curpos");
		if (checkRatio.checked == true)
			textY.value = document.getElementById("edit-resize-y-scroll").getAttribute("curpos");
		updateDescription(document.getElementById("edit-resize-info-des"), newParseWidth, newParseHeight);
	}
}

function resize_scroll_y() {
	var checkPix = document.getElementById("pixel-radio");
	var checkPer = document.getElementById("percent-radio");
	var checkRatio = document.getElementById("edit-resize-ratio-check");
	var scrollX = document.getElementById("edit-resize-x-scroll");
	var scrollY = document.getElementById("edit-resize-y-scroll");
	var scrollXpos = document.getElementById("edit-resize-x-scroll").getAttribute("curpos");
	var scrollYpos = document.getElementById("edit-resize-y-scroll").getAttribute("curpos");
	var newWidth = tmpImage.boxObject.width / 100 * scrollXpos;
	var newParseWidth = parseInt(newWidth, 10);
	var newHeight = tmpImage.boxObject.height / 100 * scrollYpos;
	var newParseHeight = parseInt(newHeight, 10);
	var textX = document.getElementById("edit-resize-x-text");
	var textY = document.getElementById("edit-resize-y-text");
	if (checkRatio.checked == true) {
		scrollX.setAttribute("curpos", scrollYpos);
	}
	if (checkPix.selected == true) {
		textY.value = newParseHeight;
		if (checkRatio.checked == true)
			textX.value = newParseWidth;
		updateDescription(document.getElementById("edit-resize-info-des"), -1, -1);
	}
	if (checkPer.selected == true) {
		textY.value = document.getElementById("edit-resize-y-scroll").getAttribute("curpos");
		if (checkRatio.checked == true)
			textX.value = document.getElementById("edit-resize-x-scroll").getAttribute("curpos");
		updateDescription(document.getElementById("edit-resize-info-des"), newParseWidth, newParseHeight);
	}
}

function resize_text(boxid) {
	var checkPix = document.getElementById("pixel-radio");
	var checkPer = document.getElementById("percent-radio");
	var checkRatio = document.getElementById("edit-resize-ratio-check");
	var textX = document.getElementById("edit-resize-x-text");
	var textY = document.getElementById("edit-resize-y-text");
	var newHeight;
	var newParseHeight;
	var newWidth;
	var newParseWidth;
	if (checkRatio.checked == true) {
		if (boxid == 0) {
			setZero(1);
			if (checkPix.selected == true) {
				newHeight = tmpImage.boxObject.height * textX.value / tmpImage.boxObject.width;
				newParseHeight = parseInt(newHeight, 10);
				textY.value = newParseHeight;
				updateDescription(document.getElementById("edit-resize-info-des"), -1, -1);
			}
			if (checkPer.selected == true) {
				textY.value = textX.value;
			}
		} else if (boxid == 1) {
			setZero(0);
			if (checkPix.selected == true) {
				newWidth = tmpImage.boxObject.width * textY.value / tmpImage.boxObject.height;
				newParseWidth = parseInt(newWidth, 10);
				textX.value = newParseWidth;
				updateDescription(document.getElementById("edit-resize-info-des"), -1, -1);
			}
			if (checkPer.selected == true) {
				textX.value = textY.value;
			}
		}
	}
	if (checkPix.selected == true) {
		updateDescription(document.getElementById("edit-resize-info-des"), -1, -1);
	} else if (checkPer.selected == true) {
		newHeight = tmpImage.boxObject.height / 100 * textY.value;
		newParseHeight = parseInt(newHeight, 10);
		newWidth = tmpImage.boxObject.width / 100 * textX.value;
		newParseWidth = parseInt(newWidth, 10);
		updateDescription(document.getElementById("edit-resize-info-des"), newParseWidth, newParseHeight);
	}
}

function setZero(boxtoset) {
	var resizeEditX = document.getElementById("edit-resize-x-text");
	var resizeEditY = document.getElementById("edit-resize-y-text");
	//resizeEditX.removeAttribute('value');
	//resizeEditY.removeAttribute('value');
	if (boxtoset == 0) {
		resizeEditX.value = "";
	} else if (boxtoset == 1) {
		resizeEditY.value = "";
	} else if (boxtoset == 2) {
		resizeEditX.value = "";
		resizeEditY.value = "";
	}
}

function resize_perform(type) {
	var quality = document.getElementById("edit-quality-text").value;
	var resizeValueX = document.getElementById("edit-resize-x-text").value;
	var resizeValueY = document.getElementById("edit-resize-y-text").value;
	var checkPix = document.getElementById("pixel-radio");
	var checkPer = document.getElementById("percent-radio");
	var resizeValueX2;
	var resizeValueY2;
	var newWidth;
	var newHeight;
	if (type == 0) {
		if (checkPix.selected == true) {
			resizeValueX2 = resizeValueX;
			resizeValueY2 = resizeValueY;
		} else if (checkPer.selected == true) {
			newWidth = tmpImage.boxObject.width / 100 * resizeValueX;
			resizeValueX2 = parseInt(newWidth, 10);
			newHeight = tmpImage.boxObject.height / 100 * resizeValueY;
			resizeValueY2 = parseInt(newHeight, 10);
		}
	}

	else if (type == 1) {
		newWidth = tmpImage.boxObject.width / 4 * 3;
		newHeight = tmpImage.boxObject.height / 4 * 3;
	}
	else if (type == 2) {
		newWidth = tmpImage.boxObject.width / 2;
		newHeight = tmpImage.boxObject.height / 2;
	}
	else if (type == 3) {
		newWidth = tmpImage.boxObject.width / 4;
		newHeight = tmpImage.boxObject.height / 4;
	}
	else if (type == 4) {
		newWidth = tmpImage.boxObject.width * 2;
		newHeight = tmpImage.boxObject.height * 2;
	}
	else if (type == 5) {
		newWidth = tmpImage.boxObject.width / 2 * 3;
		newHeight = tmpImage.boxObject.height / 2 * 3;
	}
	else if (type == 6) {
		newWidth = tmpImage.boxObject.width / 4 * 5;
		newHeight = tmpImage.boxObject.height / 4 * 5;
	}
	if (type == 1 || type == 2 || type == 3 ||
		type == 4 || type == 5 || type == 6) {
		resizeValueX2 = parseInt(newWidth, 10);
		resizeValueY2 = parseInt(newHeight, 10);
	}
	var newsize = resizeValueX2 + "x" + resizeValueY2;
	var commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + "-resize" + "\t" + newsize + "\t" + tmpPath;
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(resizeValueX2, resizeValueY2);
	updateDescription(document.getElementById("edit-resize-info-des"), resizeValueX2, resizeValueY2);
}

/*********************************************************************/

/* Rotate */

function rotate_listener() {
	var rotateScroll = document.getElementById("edit-rotate-scroll");
	rotateScroll.addEventListener("DOMAttrModified", rotate_print_value, false);
}

function rotate_print_value() {
	var textrotate = document.getElementById("edit-rotate-text");
	textrotate.value = document.getElementById("edit-rotate-scroll").getAttribute("curpos");
}

function rotate_perform(value) {
	var quality = document.getElementById("edit-quality-text").value;
	var currotate2;
	var currotate = document.getElementById("edit-rotate-text").value;
	if (value == -1) {
		currotate2 = currotate;
	} else {
		currotate2 = value;
	}
	var commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + "-rotate" + "\t" + currotate2 + "\t" + tmpPath;
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(-1, -1);
}

/* Flip */

function flip_perform(type) {
	var quality = document.getElementById("edit-quality-text").value;
	var commandLine;
	if (type == 1) {
		commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + "-flip" + "\t" + tmpPath;
	}
	if (type == 0) {
		commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + "-flop" + "\t" + tmpPath;
	}
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(-1, -1);
}

/*********************************************************************/

/* Drawtext  */

function drawtext_getcolor() {
	var cp = document.getElementById("edit-drawtext-colorpicker");
	var color = cp.color;
	var drawText = document.getElementById("edit-drawtext-fill-textbox");
	drawText.value = color;
}

function drawtext_listener() {
	var scrollX = document.getElementById("edit-drawtext-x-scroll");
	var scrollY = document.getElementById("edit-drawtext-y-scroll");
	var scrollSize = document.getElementById("edit-drawtext-size-scroll");
	scrollX.addEventListener("DOMAttrModified", drawtext_scroll_x, false);
	scrollY.addEventListener("DOMAttrModified", drawtext_scroll_y, false);
	scrollSize.addEventListener("DOMAttrModified", drawtext_scrollsize, false);
}

function drawtext_scroll_x(scrollid) {
	var checkPix = document.getElementById("pixel-drawtext-radio");
	var checkPer = document.getElementById("percent-drawtext-radio");
	var scrollXpos = document.getElementById("edit-drawtext-x-scroll").getAttribute("curpos");
	var scrollYpos = document.getElementById("edit-drawtext-y-scroll").getAttribute("curpos");
	var newWidth = tmpImage.boxObject.width / 100 * scrollXpos;
	var newParseWidth = parseInt(newWidth, 10);
	var newHeight = tmpImage.boxObject.height / 100 * scrollYpos;
	var newParseHeight = parseInt(newHeight, 10);
	var textX = document.getElementById("edit-drawtext-x-text");
	if (checkPix.selected == true) {
		textX.value = newParseWidth;
		updateCoord(document.getElementById("edit-drawtext-info-label"), -1, -1);
	}
	if (checkPer.selected == true) {
		textX.value = document.getElementById("edit-drawtext-x-scroll").getAttribute("curpos");
		updateCoord(document.getElementById("edit-drawtext-info-label"), newParseWidth, newParseHeight);
	}
}

function drawtext_scroll_y(scrollid) {
	var checkPix = document.getElementById("pixel-drawtext-radio");
	var checkPer = document.getElementById("percent-drawtext-radio");
	var scrollXpos = document.getElementById("edit-drawtext-x-scroll").getAttribute("curpos");
	var scrollYpos = document.getElementById("edit-drawtext-y-scroll").getAttribute("curpos");
	var newWidth = tmpImage.boxObject.width / 100 * scrollXpos;
	var newParseWidth = parseInt(newWidth, 10);
	var newHeight = tmpImage.boxObject.height / 100 * scrollYpos;
	var newParseHeight = parseInt(newHeight, 10);
	var textY = document.getElementById("edit-drawtext-y-text");
	if (checkPix.selected == true) {
		textY.value = newParseHeight;
		updateCoord(document.getElementById("edit-drawtext-info-label"), -1, -1);
	}
	if (checkPer.selected == true) {
		textY.value = document.getElementById("edit-drawtext-y-scroll").getAttribute("curpos");
		updateCoord(document.getElementById("edit-drawtext-info-label"), newParseWidth, newParseHeight);
	}
}

function drawtext_scrollsize(scrollid) {
	var scrollSizePos = document.getElementById("edit-drawtext-size-scroll").getAttribute("curpos");
	var textSize = document.getElementById("edit-drawtext-size-textbox");
	textSize.value = scrollSizePos;
}

function drawtext_text(type) {
	var checkPix = document.getElementById("pixel-drawtext-radio");
	var checkPer = document.getElementById("percent-drawtext-radio");
	var textX = document.getElementById("edit-drawtext-x-text");
	var textY = document.getElementById("edit-drawtext-y-text");
	if (checkPix.selected == true) {
		updateDescription(document.getElementById("edit-drawtext-info-label"), -1, -1);
	} else if (checkPer.selected == true) {
		var newHeight = tmpImage.boxObject.height / 100 * textY.value;
		var newParseHeight = parseInt(newHeight, 10);
		var newWidth = tmpImage.boxObject.width / 100 * textX.value;
		var newParseWidth = parseInt(newWidth, 10);
		updateDescription(document.getElementById("edit-drawtext-info-label"), newParseWidth, newParseHeight);
	}
}

function drawtext_perform(type) {
	var quality = document.getElementById("edit-quality-text").value;
	var imagePath = returnImagePath();
	var textValue = document.getElementById("edit-drawtext-text-textbox").value;
	var tempTextValue = new String(document.getElementById("edit-drawtext-text-textbox").value);
	var backSlash = "\u005c\u005C";
	var doubleQuote = "\u005c\u0022";

	tempTextValue = tempTextValue.replace(/\u005c/gi, backSlash);
	tempTextValue = tempTextValue.replace(/\u0022/gi, doubleQuote);

	var fillValue = document.getElementById("edit-drawtext-fill-textbox").value;
	var sizeValue = document.getElementById("edit-drawtext-size-textbox").value;
	var drawValueX = document.getElementById("edit-drawtext-x-text").value;
	var drawValueY = document.getElementById("edit-drawtext-y-text").value;
	var checkPix = document.getElementById("pixel-drawtext-radio");
	var checkPer = document.getElementById("percent-drawtext-radio");
	var drawValueX2;
	var drawValueY2;
	var gravityValue;
	if (checkPix.selected == true) {
		drawValueX2 = drawValueX;
		drawValueY2 = drawValueY;
	} else if (checkPer.selected == true) {
		var newWidth = tmpImage.boxObject.width / 100 * drawValueX;
		drawValueX2 = parseInt(newWidth, 10);
		var newHeight = tmpImage.boxObject.height / 100 * drawValueY;
		drawValueY2 = parseInt(newHeight, 10);
	}
	if (type == 1) {
		gravityValue = "NorthWest";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 2) {
		gravityValue = "NorthEast";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 3) {
		gravityValue = "SouthWest";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 4) {
		gravityValue = "SouthEast";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 5) {
		gravityValue = "North";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 6) {
		gravityValue = "South";
		drawValueX2 = drawValueY2 = 0;
	} else if (type == 7) {
		gravityValue = "Center";
		drawValueX2 = drawValueY2 = 0;
	}

	var newOptions = "-fill" + "\t" + fillValue + "\t" + "-pointsize" + "\t" + sizeValue + "\t" + "-gravity" + "\t" + gravityValue;
	var newDraw = "\u0027" + "text" + "\t" + drawValueX2 + "," + drawValueY2 + "\t" + "\u0022" + tempTextValue + "\u0022" + "\u0027";
	var commandLine = convertPath + "\t" + newOptions + "\t" + "-quality" + "\t" + quality + "\t" + "-draw" + "\t" + newDraw + "\t" + tmpPath + "\t" + tmpPath;
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(-1, -1);
}

/*********************************************************************/

/* Effects */

function effects_listener() {
	var scrollSolarize = document.getElementById("edit-solarize-scroll");
	var scrollSwirl = document.getElementById("edit-swirl-scroll");
	var scrollImplode = document.getElementById("edit-implode-scroll");
	var scrollWave = document.getElementById("edit-wave-scroll");
	var scrollOilpaint = document.getElementById("edit-oilpaint-scroll");
	var scrollCharcoal = document.getElementById("edit-charcoal-scroll");
	scrollSolarize.addEventListener("DOMAttrModified", effects_scroll_solarize, false);
	scrollSwirl.addEventListener("DOMAttrModified", effects_scroll_swirl, false);
	scrollImplode.addEventListener("DOMAttrModified", effects_scroll_implode, false);
	scrollWave.addEventListener("DOMAttrModified", effects_scroll_wave, false);
	scrollOilpaint.addEventListener("DOMAttrModified", effects_scroll_oilpaint, false);
	scrollCharcoal.addEventListener("DOMAttrModified", effects_scroll_charcoal, false);
}

/* SOLARIZE */
function effects_scroll_solarize() {
	var scrollPos = document.getElementById("edit-solarize-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-solarize-text");
	textbox.value = scrollPos;
}

/* SWIRL */
function effects_scroll_swirl() {
	var scrollPos = document.getElementById("edit-swirl-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-swirl-text");
	textbox.value = scrollPos;
}

/* IMPLODE */
function effects_scroll_implode() {
	var scrollPos = document.getElementById("edit-implode-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-implode-text");
	textbox.value = parseFloat(scrollPos / 50.0);
}

/* WAVE */
function effects_scroll_wave() {
	var scrollPos = document.getElementById("edit-wave-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-wave-text");
	textbox.value = scrollPos + "x" + scrollPos;
}
/* OILPAINT */
function effects_scroll_oilpaint() {
	//var oldimage = window.arguments[0];
	var scrollPos = document.getElementById("edit-oilpaint-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-oilpaint-text");
	textbox.value = scrollPos;
	if (tmpImage.boxObject.width < tmpImage.boxObject.height)
		textbox.value = parseInt(tmpImage.boxObject.width / 100 * scrollPos, 10);
	else
		textbox.value = parseInt(tmpImage.boxObject.height / 100 * scrollPos, 10);
}
/* CHARCOAL */
function effects_scroll_charcoal() {
	var scrollPos = document.getElementById("edit-charcoal-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-charcoal-text");
	if (tmpImage.boxObject.width < tmpImage.boxObject.height)
		textbox.value = parseInt(tmpImage.boxObject.width / 100 * scrollPos, 10);
	else
		textbox.value = parseInt(tmpImage.boxObject.height / 100 * scrollPos, 10);
}

function effects_perform(effectId) {
	var quality = document.getElementById("edit-quality-text").value;
	var textValue;
	var effectValue;
	var imagePath = returnImagePath();
	if (effectId == 0) {
		textValue = document.getElementById("edit-solarize-text").value;
		effectValue = "-solarize" + "\t" + textValue;
	} else if (effectId == 1) {
		textValue = document.getElementById("edit-swirl-text").value;
		effectValue = "-swirl" + "\t" + textValue;
	} else if (effectId == 2) {
		textValue = document.getElementById("edit-implode-text").value;
		effectValue = "-implode" + "\t" + textValue;
	} else if (effectId == 3) {
		textValue = document.getElementById("edit-wave-text").value;
		effectValue = "-wave" + "\t" + textValue;
	} else if (effectId == 4) {
		textValue = document.getElementById("edit-oilpaint-text").value;
		effectValue = "-paint" + "\t" + textValue;
	} else if (effectId == 5) {
		textValue = document.getElementById("edit-charcoal-text").value;
		effectValue = "-charcoal" + "\t" + textValue;
	}
	var commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + effectValue + "\t" + tmpPath;
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(-1, -1);
}

/*********************************************************************/

/* Enhance */

function enhance_listener() {
	var scrollHue = document.getElementById("edit-hue-scroll");
	var scrollSaturation = document.getElementById("edit-saturation-scroll");
	var scrollBrightness = document.getElementById("edit-brightness-scroll");
	var scrollGamma = document.getElementById("edit-gamma-scroll");
	scrollHue.addEventListener("DOMAttrModified", enhance_scroll_hue, false);
	scrollSaturation.addEventListener("DOMAttrModified", enhance_scroll_saturation, false);
	scrollBrightness.addEventListener("DOMAttrModified", enhance_scroll_brightness, false);
	scrollGamma.addEventListener("DOMAttrModified", enhance_scroll_gamma, false);
}

/* HUE */
function enhance_scroll_hue() {
	var scrollPos = document.getElementById("edit-hue-scroll").getAttribute("curpos");
	var textbox = document.getElementById("edit-hue-text");
	textbox.value = scrollPos;
}

/* SATURATION */
function enhance_scroll_saturation() {
	scrollPos = document.getElementById("edit-saturation-scroll").getAttribute("curpos");
	textbox = document.getElementById("edit-saturation-text");
	textbox.value = scrollPos;
}

/* BRIGHTNESS */
function enhance_scroll_brightness() {
	scrollPos = document.getElementById("edit-brightness-scroll").getAttribute("curpos");
	textbox = document.getElementById("edit-brightness-text");
	textbox.value = scrollPos;
}

/* GAMMA */
function enhance_scroll_gamma() {
	scrollPos = document.getElementById("edit-gamma-scroll").getAttribute("curpos");
	textbox = document.getElementById("edit-gamma-text");
	textbox.value = parseFloat(scrollPos / 10);
}

function enhance_perform(enhanceId) {
	var quality = document.getElementById("edit-quality-text").value;
	var textValue;
	var enhanceValue;
	var imagePath = returnImagePath();
	var effectValue;
	if (enhanceId == 0) {
		textValue = document.getElementById("edit-hue-text").value;
		effectValue = "-modulate" + "\t" + "100,100," + textValue;
	} else if (enhanceId == 1) {
		textValue = document.getElementById("edit-saturation-text").value;
		effectValue = "-modulate" + "\t" + "100," + textValue + ",100";
	} else if (enhanceId == 2) {
		textValue = document.getElementById("edit-brightness-text").value;
		effectValue = "-modulate" + "\t" + textValue + ",100,100";
	} else if (enhanceId == 3) {
		textValue = document.getElementById("edit-gamma-text").value;
		effectValue = "-gamma" + "\t" + textValue;
	} else if (enhanceId == 4) {
		effectValue = "-spiff";
	} else if (enhanceId == 5) {
		effectValue = "-dull";
	} else if (enhanceId == 6) {
		effectValue = "-equalize";
	} else if (enhanceId == 7) {
		effectValue = "-normalize";
	} else if (enhanceId == 8) {
		effectValue = "-negate";
	} else if (enhanceId == 9) {
		effectValue = "-colorspace" + "\t" + "gray";
	}
	var commandLine = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + effectValue + "\t" + tmpPath;
	//alert  (commandLine);
	performCommand(commandLine);
	var checkGet = document.getElementById("edit-getchanges-check");
	if (checkGet.checked == true) {
		get_changes();
	}
	drawChangedImage(-1, -1);
}

/*********************************************************************/

/* Perform functions */

function performCommand(commandLine) {
	//var S = "";
	/*if (nbUndoMax < UNDOMAX)
	 {
	 commandLineArray.push(commandLine);
	 nbUndoMax++;
	 }*/
	/*if (nbUndoMax <= UNDOMAX) {
	 nbUndoMax++;
	 }
	 if (nbUndoMax > UNDOMAX) {
	 commandLineArray.shift();
	 nbUndoMax--;
	 }*/
	/*for (var i = 0; i < commandLineArray.length; i++){
	 S += "En " + i + " on trouve " + commandLineArray[i] + "\n";
	 }
	 alert(S);*/
	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	targetFile.initWithPath(lastPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(tmpPath);
	targetFile.copyTo(null, lastName);
	undoFlag = Math.abs(undoFlag);
	document.getElementById("edit-lastundo").setAttribute("disabled", "false");
	performCommandOnly(commandLine);
}

function performCommandOnly(commandLine) {
	//var filelistbox = window.arguments[2];
	//var selectedItem = filelistbox.selectedItem;
	var fileUtil = new FileUtils();
	var imagePath = returnImagePath();
	var image = window.arguments[0];
	var imageURL = image.src;
	var paramsList = getParams(commandLine, imagePath);
	var commandnotfound = window.arguments[4];
	var paramsOnly = new Array();
	var command = paramsList[0];

	for (var i = 1; i < paramsList.length; i++) {
		paramsOnly[i - 1] = paramsList[i];
	}
	try {
		var rv = fileUtil.execute(command, paramsOnly);
		//alert (" command == " + commandLine);
		if (rv == null) {
			alert(command + " : " + commandnotfound);
			window.close();
		}
	} catch (e) {
		alert(e);
	}
	//var thumbItem = selectedItem.lastChild.firstChild;
	//if (thumbItem.nodeName == "image")
	//	thumbItem.src = "";
	image.src = "";
	clearCache();
	image.src = imageURL;
	//if (thumbItem.nodeName == "image")
	//	thumbItem.src = imageURL;
	changedFlag = Math.abs(changedFlag);
}

/* Win32 exception (I hate that) :
 We have to check the three 1st quotes and the last one :
 - The convert.exe path are between the two 1st quotes
 - The two others appear with draw text feature
 This function return an array withe the three 1st quotes indices
 (the last quote indice will be checked after). */
function returnWin32Quote(commandLine) {
	var win32Quote = new Array();
	var nbQuote = 0;
	if (navigator.platform == "Win32") {
		//alert ("Win32");
		for (i = 0; i < commandLine.length; i++) {
			if (commandLine[i] == "'") {
				win32Quote[nbQuote] = i;
				nbQuote++;
			}
			if (nbQuote > 2) {
				return (win32Quote);
			}
		}
	}
	return win32Quote;
}

function returnFirstQuote(commandLine) {
	var firstQuote = 0;
	for (var i = 0; i < commandLine.length; i++) {
		if (commandLine[i] == "'") {
			firstQuote = i;
			return firstQuote;
		}
	}
	return 0;
}

function getParams(commandLine, imagePath) {
	var params = new Array();
	var simpleQuote = new Array();
	var win32Quote = new Array();
	win32Quote = returnWin32Quote(commandLine);
	var index = 0;
	var quote = false;
	var i = 0;
	var lastQuote = 0;
	var firstQuote = returnFirstQuote(commandLine);
	params[index] = "";
	for (i = 0; i < commandLine.length; i++) {
		if (commandLine[i] == "'") {
			lastQuote = i;
		}
	}

	for (i = 0; i < commandLine.length; i++) {
		if (
			(
				((navigator.platform != "Win32") &&
					(i == firstQuote && commandLine[i] == "'")) ||
					((navigator.platform != "Win32") &&
						(i == lastQuote && commandLine[i] == "'"))
				) || (
				((navigator.platform == "Win32") &&
					(i == win32Quote[1] && commandLine[i] == "'")) ||
					((navigator.platform == "Win32") &&
						(i == win32Quote[0] && commandLine[i] == "'")) ||
					((navigator.platform == "Win32") &&
						(i == win32Quote[2] && commandLine[i] == "'")) ||
					((navigator.platform == "Win32") &&
						(i == lastQuote && commandLine[i] == "'"))
				)
			) {
			quote = !quote;
		}
		else if (commandLine[i] == '\t' && !quote) {
			index++;
			params[index] = "";
		} else
			params[index] = params[index] + commandLine[i];
	}
	for (i = 0; i < params.length; i++) {
		if (params[i] == '%f')
			params[i] = imagePath;
	}
	return(params);
}

function clearCache() {
	var classID = Components.classes["@mozilla.org/network/cache-service;1"];
	var cacheService = classID.getService(Components.interfaces.nsICacheService);
	cacheService.evictEntries(Components.interfaces.nsICache.STORE_ON_DISK);
	cacheService.evictEntries(Components.interfaces.nsICache.STORE_IN_MEMORY);
}

/*********************************************************************/

/* Changes */

function get_changes() {
	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	targetFile.initWithPath(bakPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(tmpPath);
	try {
		targetFile.copyTo(null, bakName);
	} catch (e) {
		alert(e);
	}
	refreshCurrentImage();
	drawChangedImage(-1, -1);
}

function perform_get_changes() {
	var commandline = convertPath + "\t" + tmpPath + "\t" + bakPath;
	return commandline;
}

function undoAllChanges() {
	/*var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	 targetFile.initWithPath(bakPath);
	 if( targetFile.exists() == true ) targetFile.remove( false );
	 targetFile.initWithPath(tmpPath);
	 if( targetFile.exists() == true ) targetFile.remove( false );
	 targetFile.initWithPath(imagePath);
	 targetFile.copyTo (null, bakName);
	 targetFile.copyTo (null, tmpName);*/
	var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
	targetFile.initWithPath(tmpPath);
	if (targetFile.exists() == true) targetFile.remove(false);
	targetFile.initWithPath(lastPath);
	if (targetFile.exists() == true) targetFile.remove(false);

	targetFile.initWithPath(bakPath);
	targetFile.copyTo(null, tmpName);
	targetFile.copyTo(null, lastName);
}

function undo_changes() {
	/*if (commandLineArray.length > 0) {
	 undoAllChanges();
	 for (var i = 0; i < commandLineArray.length; i++) {
	 commandLineArray.pop();
	 }
	 refreshCurrentImage();
	 drawChangedImage (-1, -1);
	 }*/
	undoAllChanges();
	refreshCurrentImage();
	drawChangedImage(-1, -1);
}

function undo_last_change() {
	/*var S = "";
	 if (commandLineArray.length > 0) {
	 undoAllChanges();
	 commandLineArray.pop();
	 for (var i = 0; i < commandLineArray.length; i++) {
	 performCommandOnly(commandLineArray[i]);
	 }*/
	/*for (var i = 0; i < commandLineArray.length; i++){
	 S += "En " + i + " on trouve " + commandLineArray[i] + "\n";
	 }
	 alert(S + "\n" + commandLineArray.length);*/
	/*refreshCurrentImage();
	 drawChangedImage (-1, -1);
	 }*/
	if (undoFlag == 1) {
		var targetFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		targetFile.initWithPath(tmpPath);
		if (targetFile.exists() == true) targetFile.remove(false);
		targetFile.initWithPath(lastPath);
		targetFile.copyTo(null, tmpName);
		refreshCurrentImage();
		undoFlag = Math.abs(undoFlag);
		drawChangedImage(-1, -1);
		document.getElementById("edit-lastundo").setAttribute("disabled", "true");
		undoFlag = -1;
	}
}

/*********************************************************************/

/* Quality */

function quality_listener() {
	var qualityText = document.getElementById("edit-quality-text");
	var qualityScrollbar = document.getElementById("edit-quality-scrollbar");
	qualityScrollbar.addEventListener("DOMAttrModified", function (e) {
		if (e.attrName == "curpos" && this.scrollLeft != e.prevValue)
			qualityText.value = qualityScrollbar.getAttribute("curpos");
	}, false);
}

/*********************************************************************/

/* Save changed */

function save_changed_image() {
	var saveasStr = window.arguments[1];
	var fileUtil = new FileUtils();
	var mainImage = window.arguments[0];
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, saveasStr, nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterImages);
	//fp.appendFilter(" ","*.bmp; *.jpg; *.png; *.ps" );
	fp.defaultString = baseNameFromUrl(mainImage.src);
	var res = fp.show();
	if (res == nsIFilePicker.returnOK || nsIFilePicker.returnReplace) {
		var destFile = fp.file;
		//try {
		save(tmpSrc, destFile.path);
		//} catch(e) { alert(e); }
	}
	drawChangedImage(-1, -1);
}

function showFile(imageURL) {
	var mainImage = window.arguments[0];
	mainImage.removeAttribute('width');
	mainImage.removeAttribute('height');
	mainImage.src = imageURL;
}

function baseNameFromUrl(url) {
	var nsIURL = Components.interfaces.nsIURL;
	var urlComp = Components.classes['@mozilla.org/network/standard-url;1'].createInstance(nsIURL);
	urlComp.spec = url;
	return(urlComp.fileName);
}

function save(url, fileName) {
	/* Use Convert because of format changes and compression quality. */

	var quality = document.getElementById("edit-quality-text").value;
	var existflag = false;
	if (fileName == imagePath) {
		onceSavedErase = true;
		existflag = true;
	}
	var commandline = convertPath + "\t" + tmpPath + "\t" + "-quality" + "\t" + quality + "\t" + fileName;
	//alert("commandline == " + commandline);
	performCommandOnly(commandline);
	changedFlag = -1;
	if (existflag == false) {
		onceSavedNew = true;
	}
}

/*********************************************************************/

/* Refresh */

function refreshCurrentImage() {
	//var filelistbox = window.arguments[2];
	//var selectedItem = filelistbox.selectedItem;
	var image = window.arguments[0];
	var imageURL = image.src;
	//var thumbItem = selectedItem.lastChild.firstChild;
	//if (thumbItem.nodeName == "image")
	//thumbItem.src = "";
	image.src = "";
	clearCache();
	image.src = imageURL;
	//if (thumbItem.nodeName == "image")
	//thumbItem.src = imageURL;
}

/* Draw */

function drawChangedImage(x, y) {
	tmpImage.removeAttribute('width');
	tmpImage.removeAttribute('height');
	bakImage.removeAttribute('width');
	bakImage.removeAttribute('height');
	tmpImage.src = tmpSrc;
	//bakImage.src = oldimage.src;
	bakImage.src = bakSrc;
	//var filename = image.src;
	//var filenameBak = oldimage.src;
	var filenameTmp = tmpSrc;
	var filenameBak = bakSrc;
	tmpImage.src = "";
	bakImage.src = "";
	//image.width = oldimage.boxObject.width;
	//image.height = oldimage.boxObject.height;
	/*if (x > 0)
	 tmpImage.width = x;
	 if (y > 0)
	 tmpImage.height = y;*/
	tmpImage.src = filenameTmp;
	bakImage.src = filenameBak;
	//autosize ();
}

/*********************************************************************/

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

function supportedType(file) {
	var result = false;
	var extList = prefs.getExtList();
	for (var i = 0; i < extList.length; i++) {
		if (extList[i].toUpperCase() == file.ext.toUpperCase())
			result = true;
	}
	return(result);
}

function getFileItem(fileName) {
	var fullpath = window.arguments[3];
	var fileUtil = new FileUtils();
	var fullFileName = PathToURI(fileUtil.append(fullpath.value, fileName));

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

function PathToURI(aPath) {
	const JS_URIFIX = new Components.Constructor("@mozilla.org/docshell/urifixup;1", "nsIURIFixup");
	var uriFixup = new JS_URIFIX();

	var fixedURI = uriFixup.createFixupURI(aPath, 0);
	return(fixedURI.spec);
}


function emptyList() {
	var dirlistbox = window.arguments[6];
	var filelistbox = window.arguments[2];
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
	window.close();
}

function directorySearch(adir) {
	var dirnotfound = mozImageBundle.formatStringFromName("dirnotfound", [], 0);
	var dirlistbox = window.arguments[6];
	var filelistbox = window.arguments[2];
	var d = new Dir(adir);
	var dirList = d.readDir();
	if (dirList == null) {
		alert(dirnotfound);
		return;
	}

	var fullpath = window.arguments[3];

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
	if (prefs.getEnableCurrent()) {
		prefs.setHomeDir(adir);
	}
}

/*********************************************************************/

/* Hide the advanced Edition options */

function make_check() {
	var checkAdvanced = document.getElementById("advanced-checkbox");
	if (checkAdvanced.checked == true) {
		checkAdvanced.setAttribute("checked", "false");
	}
	else if (checkAdvanced.checked == false) {
		checkAdvanced.setAttribute("checked", "true");
	}
	advanced_check();
}

function advanced_check() {
	var resizeTab = document.getElementById("t1");
	var rotateTab = document.getElementById("t2");
	var drawtextTab = document.getElementById("t3");
	var effectsTab = document.getElementById("t4");
	var enhanceTab = document.getElementById("t5");
	var resizeExpert = document.getElementById("edit-resize-expert");
	var rotateExpert = document.getElementById("edit-rotate-expert");
	var drawtextExpert = document.getElementById("edit-drawtext-expert");
	var editChanges = document.getElementById("edit-changes");
	var editImage = document.getElementById("edit-image-expert");
	var checkAdvanced = document.getElementById("advanced-checkbox");
	if (checkAdvanced.checked == true) {
		resizeExpert.setAttribute("hidden", "false");
		rotateExpert.setAttribute("hidden", "false");
		drawtextExpert.setAttribute("hidden", "false");
		//editChanges.setAttribute("hidden", "false");
		//editImage.setAttribute("hidden", "false");
		effectsTab.setAttribute("hidden", "false");
		enhanceTab.setAttribute("hidden", "false");
		//effectsTab.removeAttribute("hidden");
		//enhanceTab.removeAttribute("hidden");
	}
	if (checkAdvanced.checked == false) {
		//effectsTab.createAttribute("hidden");
		//enhanceTab.createAttribute("hidden");
		resizeExpert.setAttribute("hidden", "true");
		rotateExpert.setAttribute("hidden", "true");
		drawtextExpert.setAttribute("hidden", "true");
		//editChanges.setAttribute("hidden", "true");
		//editImage.setAttribute("hidden", "true");
		effectsTab.setAttribute("hidden", "true");
		enhanceTab.setAttribute("hidden", "true");
	}
}

/*********************************************************************/

/* Open Fullscreen Image */

function open_fullimage(type) {
	window.openDialog('chrome://mozimage/content/edit/mozimage_edit_fullimage.xul',
		"edit-fullimage",
		'chrome,centerscreen,modal=no,resizable=yes',
		document.getElementById("edit-tmp-image"),
		document.getElementById("edit-bak-image"),
		tmpSrc,
		bakSrc,
		type,
		document.getElementById("pixel-drawtext-radio"),
		document.getElementById("percent-drawtext-radio"),
		document.getElementById("edit-drawtext-x-text"),
		document.getElementById("edit-drawtext-y-text"),
		document.getElementById("edit-drawtext-info-label"));
}
