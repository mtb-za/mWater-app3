#!/bin/bash
echo "Copying files"
gulp copy_cordova_debug

cd cordova

echo "Running"
cordova -d run

cd ..
