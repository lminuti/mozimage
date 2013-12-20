var prefs = top.prefs;
var mozImageBundle = srGetStrBundle("chrome://mozimage/locale/mozimage.properties");

/*
**
** Prefs window event handlers
**
*/

function toggleExt(aExt)
{
  var index = -1;
  for(var i = 0 ; i < prefs.extList.length ; i++)
  {
    if (prefs.extList[i] == aExt)
      index = i;
  }
  if (index != -1)
    prefs.extList.splice(index, 1);
  else
    prefs.extList.push(aExt);
}

function toggleForceHTTPTumb()
{
  prefs.setForceHttpTumb(!prefs.getForceHttpTumb());
}
  
function toggleEnableCurrent()
{  
  try {
    prefs.setEnableCurrent(!prefs.getEnableCurrent());
    if (prefs.getEnableCurrent())
    {
      document.getElementById("homedir-text").setAttribute("disabled","true");
      document.getElementById("folder-button").setAttribute("disabled","true");
      document.getElementById("current-button").setAttribute("disabled","true");
    }
    else
    {
      document.getElementById("homedir-text").setAttribute("disabled","false");
      document.getElementById("folder-button").setAttribute("disabled","false");
      document.getElementById("current-button").setAttribute("disabled","false");
    }
  } catch (e) { alert (e);} 
}

function toggleDes()
{
  prefs.setDescending(!prefs.getDescending());
}
  
function toggleEnableCache() 
{
  prefs.setEnableCache(!prefs.getEnableCache());
}

function getFolder() 
{
  try {
	alert(prefs);
	console.dir(prefs);
    var selectdir = mozImageBundle.GetStringFromName("choosedir");
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, selectdir, nsIFilePicker.modeGetFolder);
    fp.appendFilters(nsIFilePicker.filterAll);
    var res = fp.show();
    if (res == nsIFilePicker.returnOK) 
    {
      var thepath = fp.file;
      document.getElementById('homedir-text').value = thepath.path; 
    }
  } 
  catch (e) { alert(e); }
}

function setCurrent() 
{
  try {
    if (top.arguments)
    {
    var fullpath =  top.arguments[0];
    document.getElementById('homedir-text').value = fullpath.value;
    }
  } catch (e) { alert (e); };
}

function prefs_load()
{
  var homedir = document.getElementById("homedir-text");
  var delay = document.getElementById("delay-text");
  var zoom = document.getElementById("zoom-text");
  var thumbSize = document.getElementById("thumb-menu");
  var orderBy = document.getElementById("orderby-menu");
  var desChk = document.getElementById("descending-check");
  var forceHttpTumbChk = document.getElementById("forcehttptumb-check");
  var enableCacheChk = document.getElementById("enablecache-check");
  var folderButton = document.getElementById("folder-button");
  var currentButton = document.getElementById("current-button");

  var enableCurrentChk = document.getElementById("enablecurrent-check");
  try {
    if (prefs.getEnableCurrent())
    {   
      homedir.setAttribute("disabled","true");
      folderButton.setAttribute("disabled","true");
      currentButton.setAttribute("disabled","true");
    }
  } catch (e) { alert(e); }

  var extList = prefs.getExtList();
  homedir.value = prefs.getHomeDir();
  delay.value = prefs.getDelay() / 1000;
  zoom.value = prefs.getZoom();
  thumbSize.value = prefs.getThumbSize();
  orderBy.value = prefs.getOrderBy();
  desChk.checked = prefs.getDescending();
  forceHttpTumbChk.checked = prefs.getForceHttpTumb();
  enableCacheChk.checked = prefs.getEnableCache();
  enableCurrentChk.checked = prefs.getEnableCurrent();

  for(var i = 0 ; i < extList.length ; i++)
  {
    var checkbox = document.getElementById(extList[i] + "-check");
    checkbox.checked = true;
  }
}

function prefs_close()
{
  try {
  var homedir = document.getElementById("homedir-text");
  var delay = document.getElementById("delay-text");
  var zoom = document.getElementById("zoom-text");
  var thumbMenu = document.getElementById("thumb-menu");
  var orderByMenu = document.getElementById("orderby-menu");

  prefs.setHomeDir(homedir.value);
  prefs.setDelay(delay.value * 1000);
  prefs.setZoom(zoom.value);
  prefs.setThumbSize(thumbMenu.value);
  prefs.setOrderBy(orderByMenu.value);
  } catch (e) { alert(e); }
}
