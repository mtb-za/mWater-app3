var browserify = require('browserify'),
    fs = require("fs");


function bundleApp(done) {
    bundle = browserify();
    bundle.extension('.coffee');
    bundle.transform('coffeeify')
    .require(require.resolve('./app/js/run'), {expose: 'run'})
    .require('./app/js/db/LocalDb', {expose: 'LocalDb'})  // For tests
    .require('./app/js/ItemTracker', {expose: 'ItemTracker'})  // For tests
    .bundle({
        debug: true
    }, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("dist/js/app.js", src);
        console.log("App bundled");
        done();
    });
}

function bundleTests(done) {
    bundle = browserify();
    bundle.extension('.coffee');
    bundle.transform('coffeeify')
    .add('./test/ItemTrackerTests')
    .add('./test/LocalDbTests')
    .add('./test/GeoJSONTests')
    .add('./test/LocationViewTests')
    .bundle({
        debug: true
    }, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("test/tests.js", src);
        done();
    });
}

module.exports = function() {
    var done = this.async();
    bundleApp(function() {
        bundleTests(done);
    });
};
