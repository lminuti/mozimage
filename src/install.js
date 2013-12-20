var displayName = 'mozImage';
var pakage = '/mozimage.mozdev.org/mozImage';
var version = '1.4.9';
var jarFileName = 'mozimage.jar';

var err = initInstall(displayName, pakage, version);
logComment("initInstall: " + err);
resetError();

var chromeFolder = getFolder('Profile', 'chrome');
setPackageFolder(chromeFolder);

addFile(displayName, 'chrome/' + jarFileName, chromeFolder, "");

var jarFolder = getFolder(chromeFolder, jarFileName);
registerChrome(CONTENT | PROFILE_CHROME, jarFolder, 'content/');
registerChrome(SKIN | PROFILE_CHROME, jarFolder, 'skin/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/en-US/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/it-IT/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/es-ES/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/fr-FR/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/cs-CZ/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/ja-JP/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/ca-AD/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/sv-SE/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/zh-TW/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/de-DE/');
registerChrome(LOCALE | PROFILE_CHROME, jarFolder, 'locale/sk-SK/');

err = getLastError();

if (err == SUCCESS)
{
  logComment('Installing mozImage.');
  performInstall();
} 
else 
{
  logComment('Error installing mozImage: ' + err);
  cancelInstall();
}
