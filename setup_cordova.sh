#!/bin/bash
rm -r cordova
cordova create cordova co.mwater.clientapp ClientApp
cd cordova
cordova platform add android
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file-transfer.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-geolocation.git
cordova plugin add https://github.com/mWater/cordova-plugin-camera-foreground.git
rm platforms/android/res/drawable-hdpi/icon.png
rm platforms/android/res/drawable-ldpi/icon.png
rm platforms/android/res/drawable-mdpi/icon.png
rm platforms/android/res/drawable-xhdpi/icon.png
cp ../dist/img/mwater-large.png platforms/android/res/drawable/icon.png
rm -r www/*.*
