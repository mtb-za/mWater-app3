app-v3
======

Version 3 of app. Uses Meteor(meteor.com)-like MongoDb for storage.

App is compiled from coffeescript using grunt + browserify into dist/ folder. Then gzipped into dist.gz/ folder.

s3cmd is used to sync to S3 bucket which serves as the website.

Browser support: IE10+ and all other modern browsers.

## Getting started

1. Clone this repository
1. Ensure you have Node.js version >= 0.10 installed
1. Ensure you have grunt-cli, browserify, bower and cordova installed globally.
1. Run `npm install` in root folder
1. Run `bower install` in root folder
1. Run `grunt`
1. Run `node server`
1. Visit http://localhost:8080/
