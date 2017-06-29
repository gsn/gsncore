
#
# Task args.
#

PORT ?= 0
BROWSER ?= ie:9
BINS = node_modules/.bin
BUILD = build.js

#
# Default target.
#

default: build

#
# Clean.
#

clean:
	@rm -f gsncore.js gsncore.min.js gsncore-basic.js gsncore-basic.min.js
	@rm -rf npm-debug.log
#
# Test with phantomjs.
#

#
# Phony targets.
#

.PHONY: clean

#
# Target for `node_modules` folder.
#

node_modules: package.json
	@npm install
	@touch $@

#
# Target for build files.
#


$(BUILD): node_modules
	$(BINS)/gulp

#
# Phony build target
#

build: $(BUILD)

.PHONY: build
