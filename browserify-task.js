var browserify = require('browserify'),
    fs = require("fs"), 
    glob = require("glob");


function bundleApp(done) {
    bundle = browserify();
    bundle.extension('.coffee');
    bundle.transform('coffeeify')
    .require('./app/js/run', {expose: 'run'})
    .require('./app/js/forms', {expose: 'forms'})  // For forms
    .require('./app/js/mobile-behavior', {expose: 'mobile-behavior'})  // For tests
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
    .require('./app/js/forms', {expose: 'forms'});  // For forms

    // Add tests
    files = glob.sync('./test/*.coffee');
    var i;
    for (i=0;i<files.length;i++)
        bundle.add(files[i]);

    bundle.bundle({
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
