var browserify = require('browserify'),
    fs = require("fs");


function bundleApp(done) {
    bundle = browserify();
    bundle.extension('.coffee');
    bundle.transform('coffeeify')
    .require(require.resolve('./app/js/run'), {expose: 'run'})
    .require('./app/js/forms', {expose: 'forms'})  // For forms
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
    .require('./app/js/forms', {expose: 'forms'})  // For forms
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
