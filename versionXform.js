var fs = require("fs"), 
    through = require('through');

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


module.exports = versionXform;