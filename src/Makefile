BUILD_DIR=build
BUILD_CHROME_DIR=$(BUILD_DIR)/chrome

JAR_FILE=$(BUILD_CHROME_DIR)/mozimage.jar
XPI_FILE=$(BUILD_DIR)/mozimage.xpi

.DEFAULT_GOAL=all

.PHONY: all clean xpi uninstall install test

all: clean xpi

clean:
	rm -rf $(BUILD_DIR)

xpi: $(XPI_FILE)

$(XPI_FILE): $(JAR_FILE)
	cp chrome.manifest COPYING install.rdf $(BUILD_DIR)
	cd $(BUILD_DIR) && zip -r $(patsubst $(BUILD_DIR)/%,%,$(XPI_FILE)) chrome.manifest COPYING install.rdf chrome
	@echo "Successfully created XPI file: $(XPI_FILE)"

$(JAR_FILE): $(BUILD_CHROME_DIR)
	cp -r content skin locale $(BUILD_CHROME_DIR)
	@echo "Successfully created JAR file: $(JAR_FILE)"

$(BUILD_CHROME_DIR): $(BUILD_DIR)
	mkdir $(BUILD_CHROME_DIR)

$(BUILD_DIR):
	mkdir $(BUILD_DIR)

uninstall:
	rm -rf $(HOME)/.mozilla
	mozilla

install: $(XPI_FILE)
	mozilla $(XPI_FILE)

test:
	mozilla -chrome chrome://mozimage/content/
