app-v3
======

Version 3 of app. Uses Meteor(meteor.com)-like MongoDb for storage.

App is compiled from coffeescript using grunt + browserify into dist/ folder. Then gzipped into dist.gz/ folder.

s3cmd is used to sync to S3 bucket which serves as the website.