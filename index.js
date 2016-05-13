#! /usr/bin/env node

var yauzl = require("yauzl");
var EasyZip = require('easy-zip').EasyZip;
var path = require("path");
var fs = require("fs");
var logSymbols = require('log-symbols');
var Transform = require("stream").Transform;
var zip = new EasyZip();
var argv = require('yargs')
    // .usage('Usage: $0 -u [zipped file path] -z [unzip folder path] -n [name of zipped file]')
    // .example('$0 -u xyz.zip')
    // .example('$0 -z /home/xy ab.zip')
    .argv; 

if (process.argv.length <= 2){
 console.log("Usage: yozip -u [zipped file path] -z [unzip folder path] -n [name of zipped file]");
 console.log("Example : \n yozip -u xyz.zip \n yozip -z /home/xy -n xy.zip");
}

// //zip a folder

if (argv.n ==null && argv.z){
console.log("Oh no! you forgot to use -n argument")
};


if (argv.z & argv.n)
{
  var zip5 = new EasyZip();
  zip5.zipFolder(argv.z,function(){
    zip5.writeToFile(argv.n);
    console.log(logSymbols.success, 'Zipped successfully!');
    });
}

if (argv.u) 
{
  var zipFilePath = argv.u;
  function mkdirp(dir, cb) {
    if (dir === ".") return cb();
    fs.stat(dir, function(err) {
      if (err == null) return cb(); // already exists
      var parent = path.dirname(dir);
      mkdirp(parent, function() {
        process.stdout.write(dir.replace(/\/$/, "") + "/\n");
        fs.mkdir(dir, cb);
      });
  });
}

yauzl.open(zipFilePath, {lazyEntries: true}, function(err, zipfile) {
  if (err) {
    console.error(logSymbols.error, err);
    return;
  }
  zipfile.readEntry();
  zipfile.on("close", function() {
    console.log(logSymbols.success, 'Unzipped successfully!');
  });
  zipfile.on("entry", function(entry) {
    if (/\/$/.test(entry.fileName)) {
      // directory file names end with '/'
      mkdirp(entry.fileName, function() {
        if (err) throw err;
        zipfile.readEntry();
      });
    } else {
      // ensure parent directory exists
      mkdirp(path.dirname(entry.fileName), function() {
        zipfile.openReadStream(entry, function(err, readStream) {
          if (err) throw err;
          // report progress through large files
          var byteCount = 0;
          var totalBytes = entry.uncompressedSize;
          var lastReportedString = byteCount + "/" + totalBytes + "  0%";
          process.stdout.write(entry.fileName + "..." + lastReportedString);
          function reportString(msg) {
            var clearString = "";
            for (var i = 0; i < lastReportedString.length; i++) {
              clearString += "\b";
              if (i >= msg.length) {
                clearString += " \b";
              }
            }
            process.stdout.write(clearString + msg);
            lastReportedString = msg;
          }
          // report progress at 60Hz
          var progressInterval = setInterval(function() {
            reportString(byteCount + "/" + totalBytes + "  " + ((byteCount / totalBytes * 100) | 0) + "%");
          }, 1000 / 60);
          var filter = new Transform();
          filter._transform = function(chunk, encoding, cb) {
            byteCount += chunk.length;
            cb(null, chunk);
          };
          filter._flush = function(cb) {
            clearInterval(progressInterval);
            reportString("");
            // delete the "..."
            process.stdout.write("\b \b\b \b\b \b\n");
            cb();
            zipfile.readEntry();
          };
          // pump file contents
          readStream.pipe(filter).pipe(fs.createWriteStream(entry.fileName));
        });
      });
    }
  });
});
}