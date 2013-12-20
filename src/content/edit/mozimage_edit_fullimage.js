include (jslib_dirutils);
//include (jslib_prefs);
include (jslib_fileutils);
include (jslib_file);
include (jslib_dir);

include ("chrome://mozimage/content/prefs/mozimage_prefs.js");
include ("chrome://global/content/strres.js");

const XMLNS = "http://www.w3.org/XML/1998/namespace";

var mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");
var offset = new Array ();
var tmpImage = window.arguments[0];
var bakImage = window.arguments[1];
var tmpSrc = window.arguments[2];
var bakSrc = window.arguments[3];
var type = window.arguments[4];
var ratio;

/**
 * This function is called when the fullimage window is opened.
 * It drawImage and call 2 listeners :
 * one for vhevking the coordinates of click events
 * one amother for reload the image
 */

function edit_fullimage_load (event)
{
    //alert ("Load");
    //alert("tmpSrc == " + tmpSrc);
    drawFullImage();
    mouse_on_image_listener ();
    reload_listener ();
}

/**
 * This one is called when the window close.
 */

function edit_fullimage_close ()
{
    tmpImage.removeEventListener ("DOMAttrModified", reloadImage, false );
    window.close();
}

/**
 * This reload_listener add a event listener to refresh image.
 */

function reload_listener ()
{
    tmpImage.addEventListener ( "DOMAttrModified", reloadImage, false ); 
}

/**
 * ReloadImage...reload the pop-up image.
 */

function reloadImage ()
{
    //var type = window.arguments[4];
    //if (type == 1) {
	var fullImage = document.getElementById("edit-full");
	fullImage.removeAttribute('width');
	fullImage.removeAttribute('height');
	fullImage.src = tmpSrc;
	fullImage.src = "";
	var filenameTmp = tmpSrc;
	if (tmpImage.boxObject.width > 0)
	    fullImage.width = tmpImage.boxObject.width;
	if (tmpImage.boxObject.height > 0)
	    fullImage.height = tmpImage.boxObject.height;
	fullImage.src = filenameTmp;
	//    }
}

/**
 * Used to draw the image.
 * DEPRECIATED : var type is no longer used,
 * as we don't open pop-up for bak image.
 */

function drawFullImage()
{
    var fullImage = document.getElementById("edit-full");
    if (type == 0) {
	fullImage.src = tmpSrc;
	//fullImage.removeAttribute('width');
	//fullImage.removeAttribute('height');
	var filenameTmp = tmpSrc;
	fullImage.src = "";
	fullImage.width = tmpImage.boxObject.width;
	fullImage.height = tmpImage.boxObject.height;
	fullImage.src = filenameTmp;
    }
    //bakImage.src = oldimage.src;

    else if (type == 1) {
	fullImage.src = bakSrc;
	//fullImage.removeAttribute('width');
	//fullImage.removeAttribute('height');
	var filenameBak = bakSrc;
	fullImage.src = "";
	fullImage.width = bakImage.boxObject.width;
	fullImage.height = bakImage.boxObject.height;
	fullImage.src = filenameBak;
    }
    //alert ("fullImage.height == " + fullImage.height);
    autoSize();
}

/**
 * Resize the image with considerations of conteners size.  
 */

function autoSize()
{
  var image = document.getElementById("edit-full");
  // avoid an infinite loop
  var modImageLastImage;
  if (modImageLastImage != image.src) 
  {
    modImageLastImage = image.src;
    var newImage = new Image();
    newImage.setAttribute("id", "thepreviewimage");
    newImage.src = image.src;
    var box = document.getElementById("edit-fullimage-box");
    var boxWidth = box.boxObject.width;
    var boxHeight = box.boxObject.height;
    var filename = image.src;
    var xratio = newImage.width / boxWidth;
    var yratio = newImage.height / boxHeight;
    ratio = (xratio > yratio) ? xratio : yratio;
  
    image.src = "";
    image.width = newImage.width / ratio;
    image.height = newImage.height / ratio;
    image.src = filename;
  }
}

/**
 * Listener for the mousedown event.
 * It launch a function that check the coordinates of the click.
 */

function mouse_on_image_listener()
{
    addEventListener("mousedown", setImageListener, true);
    //addEventListener("onoverflow", testListener, true);
}

/**
 * setImageListener set the offset array with the mouse click coordinates.
 * It also launch setDrawtextClick that update coordinates of Drawtext Panel.
 */

function setImageListener (event) {
    if (event.target.boxObject.element.id == "edit-full") {
	offset[0] = ( event.clientX - event.target.boxObject.x);
	offset[1] = ( event.clientY - event.target.boxObject.y);
    }
    //alert (offset[0] + "x" + offset[1]);

    setDrawtextClick (type);
    updateCoord(document.getElementById("edit-full-info"), parseInt(offset[0] * ratio), parseInt(offset[1] * ratio));
}

/**
 * Set the drawtext X and Y with the mousedowm click.
 * DEPRECIATED : var type is no longer used,
 * as we don't open pop-up for bak image.
 */

function setDrawtextClick (type)
{
    var checkPix = window.arguments[5];
    var checkPer = window.arguments[6];
    var textX = window.arguments[7];
    var textY = window.arguments[8];
    var textInfo = window.arguments[9];
    var xRatio = offset[0] * ratio;
    var yRatio = offset[1] * ratio;
    //textX.value = xRatio; textY.value = yRatio;
    if (checkPix.selected == true) {
	textX.value = parseInt(xRatio, 10); textY.value = parseInt(yRatio, 10);
	//textX.value = offset[0]; textY.value = offset[1];
	updateDescription(textInfo, -1, -1);
    } else if (checkPer.selected == true) {
	if (type == 0) {
	    textX.value = parseInt(xRatio / tmpImage.boxObject.width * 100, 10);
	    textY.value = parseInt(yRatio / tmpImage.boxObject.height * 100, 10);
	}
	else if (type == 1) {
	    textX.value = parseInt(xRatio / bakImage.boxObject.width * 100, 10);
	    textY.value = parseInt(yRatio / bakImage.boxObject.height * 100, 10);
	}
	updateDescription(textInfo, xRatio, yRatio);
    }
}

function updateCoord(info, x, y)
{
    if (x == -1 && y == -1)
	info.value = " ";
    else
	info.value = mozImageBundle.formatStringFromName("coordInfo", [x + "px", y + "px"], 2);
}

function updateDescription(info, x, y)
{
    if (x == -1 && y == -1)
	info.value = "";
    else
	info.value = mozImageBundle.formatStringFromName("sizeInfo", [x + "px", y + "px"], 2);
}
