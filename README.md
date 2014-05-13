## Version 3 of mWater's cross-platform water monitoring app

### Technology

HTML5 + Javascript with full offline capability. Data is stored in a Javascript version of MongoDb and then synchronized to a central server.

UI is based on stock Twitter Bootstrap with Backbone.js for views.

App is compiled from coffeescript using grunt + browserify into dist/ folder. Then gzipped into dist.gz/ folder.

On Phonegap version, it has access to native computer vision technology implemented as a plugin (https://github.com/mWater/OpenCVActivityPlugin)

Browser support: IE10+ and all other modern browsers.

s3cmd is used to sync to S3 bucket which serves as the website.

### Getting started

1. Clone this repository
1. Ensure you have Node.js version >= 0.10 installed
1. Ensure you have grunt-cli, browserify, bower and cordova installed globally.
1. Run `npm install` in root folder
1. Run `bower install` in root folder
1. Run `grunt`
1. Run `node server`
1. Visit http://localhost:8080/

Source code is under `app/js`. Each page resides in `app/js/pages` folder. Handlebars is used for templating. 

Paging is done with a custom library `app/js/Pager.coffee` based on Backbone.
