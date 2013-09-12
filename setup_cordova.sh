#!/bin/bash
rm -r cordova
cordova create cordova co.mwater.clientapp mWater
cd cordova
cordova platform add android
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-file-transfer.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device-orientation.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-network-information.git
cordova plugin add https://github.com/mWater/cordova-plugin-camera-foreground.git
cordova plugin add https://github.com/mWater/OpenCVActivityPlugin.git
cordova plugin add https://github.com/mWater/cordova-plugin-acra.git
cordova plugin add https://github.com/mWater/cordova-plugin-geolocation.git
rm platforms/android/res/drawable-hdpi/icon.png
rm platforms/android/res/drawable-ldpi/icon.png
rm platforms/android/res/drawable-mdpi/icon.png
rm platforms/android/res/drawable-xhdpi/icon.png
rm -r platforms/android/assets/www/*
cp ../dist/img/mwater-large.png platforms/android/res/drawable/icon.png
rm -r www/*

echo "key.store=/home/clayton/.ssh/mwater.keystore" >> ./platforms/android/ant.properties
echo "key.alias=mwater" >> ./platforms/android/ant.properties
echo "TODO: Now update config.xml in android to run index_cordova.html?cordova= and other values not copied" 
echo "TODO: Adjust minSdkVersion in AndroidManifest.xml to 8"
echo "TODO: Set versionCode and versionName in AndroidManifest.xml for EACH release" 
echo 'TODO: Add android:name="co.mwater.acraplugin.MyApplication" to application element of AndroidManifest.xml'
echo 'TODO: Add <uses-feature android:name="android.hardware.camera" android:required="false" /> to AndroidManifest.xml'
echo "TODO: Put         super.init(); before loadUrl if CB-4620 not fixed"
cd ..