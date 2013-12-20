mkdir chrome
del chrome\mozimage.jar
del mozimage.xpi
zip chrome\mozimage.jar -r content locale skin -x CVS
zip mozimage.xpi -r chrome COPYING install.js install.rdf chrome.manifest
pause