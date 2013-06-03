var browserify = require('browserify'),
    fs = require("fs");

bundle = browserify();
bundle.extension('.coffee');

module.exports = function() {
    var done = this.async();
    bundle.transform('coffeeify').require(require.resolve('./app/js/run'), {
        entry: true
    }).bundle({
        debug: true
    }, function(err, src) {
        if (err) return console.error(err);

        fs.writeFileSync("dist/app.js", src);
        done();
    });
};
