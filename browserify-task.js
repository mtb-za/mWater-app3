var browserify = require('browserify'),
    fs = require("fs");

bundle = browserify();
bundle.extension('.coffee');

module.exports = function() {
    var done = this.async();
    bundle.transform('coffeeify')
    .require(require.resolve('./app/js/run'), {expose: 'run'})
    .require('./app/js/db/LocalDb', {expose: 'LocalDb'})  // For tests
    .require('./app/js/ItemTracker', {expose: 'ItemTracker'})  // For tests
    .bundle({
        debug: true
    }, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("dist/js/app.js", src);
        done();
    });
};
