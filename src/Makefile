xpi: mozimage.jar
	zip -r mozimage.xpi chrome COPYING install.js install.rdf

mozimage.jar:
	zip -r mozimage.jar content skin locale
	cp mozimage.jar chrome/mozimage.jar

clear:
	rm -f mozimage.jar mozimage.xpi chrome/mozimage.jar

uninstall:
	rm -rf $(HOME)/.mozilla
	mozilla

install:
	mozilla mozimage.xpi

test:
	mozilla -chrome chrome://mozimage/content/

all: clear xpi uninstall install
	echo "Done."