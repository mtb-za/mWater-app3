#!/bin/bash
cd cordova
echo "Copying files"
grunt cordova_release

echo "Preparing"
cordova -d prepare

echo "Signing"
./platforms/android/cordova/build --release
cd ..