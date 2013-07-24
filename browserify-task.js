var browserify = require('browserify'),
    fs = require("fs"), 
    glob = require("glob"),
    through = require('through');

var pjson = require('./package.json');

// Adds version info
var version = pjson.version;

var versionXform = function (file) {
    var data = '';
    return through(write, end);

    function write (buf) { data += buf }
    function end () {
        this.queue(data.replace("//VERSION//", version));
        this.queue(null);
    }
};


function bundleApp(done) {
    bundle = browserify();
    bundle.extension('.coffee');
    bundle.transform(versionXform).transform('coffeeify')
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
    for (i=0;i<files.length;i++) {
        console.log("Adding test:" + files[i]);
        bundle.add(files[i]);
    }

    bundle.bundle({
        debug: true
    }, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("test/tests.js", src);
        console.log("Tests bundled");
        done();
    });
}

module.exports = function() {
    var done = this.async();
    bundleApp(function() {
        bundleTests(done);
    });
};
