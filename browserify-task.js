var browserify = require('browserify'),
    fs = require("fs"), 
    glob = require("glob"),
    through = require('through'), 
    exposify = require('exposify');

exposify.config = { jquery: '$', lodash: "_", underscore: "_"};
exposify.filePattern = /\.js$|\.coffee$/;

// Adds version info
var versionXform = function (file) {
    pjson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    version = pjson.version;

    var data = '';
    return through(write, end);

    function write (buf) { data += buf }
    function end () {
        this.queue(data.replace("//VERSION//", version));
        this.queue(null);
    }
};


function bundleApp(done) {
    // Set up exposify to handle included scripts    
    bundle = browserify({extensions: ".coffee"})
        .transform(versionXform).transform('coffeeify')
        .transform(exposify)
        .require('./app/js/run', {expose: 'run'})
        .require('./app/js/forms', {expose: 'forms'})  // For forms
        .require('./app/js/mobile-behavior', {expose: 'mobile-behavior'})  // For tests
        .bundle({}, function(err, src) {
            if (err) return console.error(err);

            fs.writeFileSync("dist/js/app.js", src);
            console.log("App bundled");
            done();
        });
}

function bundlePreload(done) {
    bundle = browserify({extensions: ".coffee"});
    bundle.transform(versionXform).transform('coffeeify')
    .add('./app/js/preload')
    .bundle({}, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("dist/js/preload.js", src);
        console.log("Preload bundled");
        done();
    });
}

function bundleTests(done) {
    bundle = browserify({extensions: ".coffee"});
    bundle.transform('coffeeify')
        .transform(exposify)
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
        bundlePreload(function() {
            bundleTests(done);
        });
    });
};
