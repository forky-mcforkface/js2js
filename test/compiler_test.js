var expect   = require("expect.js"),
    fs       = require('fs'),
    Compiler = require("../src/compiler.js");

describe('Js2JsCompiler', function() {
  var compiler;

  var baseDir;
  var fileFoo;
  var fileBar;
  var nonExistingFile;
  var fileFooContent;
  var fileBarContent;

  beforeEach(function() {
    compiler        = new Compiler.Js2JsCompiler(console.log, false, false);
    baseDir         = "tmp_resources";
    fileFoo         = baseDir + "/foo.js";
    fileBar         = baseDir + "/bar.js";
    nonExistingFile = baseDir + "/newFile.js";
    fileFooContent  = "console.log('foo');";
    fileBarContent  = "console.log('bar');";
    fs.mkdirSync(baseDir);
    fs.writeFileSync(fileFoo, fileFooContent);
    fs.writeFileSync(fileBar, fileBarContent);
  });

  afterEach(function() {
    fs.unlinkSync(fileFoo);
    fs.unlinkSync(fileBar);
    fs.rmdirSync(baseDir);
  });

  describe('#compile()', function() {
    it('should fail on same location', function() {
      var ret = compiler.compile(fileFoo, fileFoo);
      expect(ret.ok).to.be(false);
      expect(ret.status).to.contain('already js2js-compiled');
      expect(fs.readFileSync(fileFoo).toString()).to.equal(fileFooContent);
    });

    it('should fail on existing file when not force', function() {
      var ret = compiler.compile(fileBar, fileFoo);
      expect(ret.ok).to.be(false);
      expect(ret.status).to.contain('location already exists');
      expect(fs.readFileSync(fileFoo).toString()).to.equal(fileFooContent);
    });

    it('should compile existing file when force', function() {
      compiler._forceOverwrite = true;
      var ret = compiler.compile(fileBar, fileFoo);
      expect(ret.ok).to.be(true);
      expect(fs.readFileSync(fileFoo).toString()).to.equal(fileBarContent);
    });

    it('should fail on symlinks', function() {
      var fooSymlink = "fooLink.js";
      fs.symlinkSync(fileFoo, fooSymlink);
      var ret = compiler.compile(fooSymlink, nonExistingFile);
      expect(ret.ok).to.be(false);
      expect(ret.status).to.contain('location should be both');
      fs.unlinkSync(fooSymlink);
    });
  });

  describe('#compileCode()', function() {
    it('should accept empty code', function() {
      var emptyCode = '';
      expect(emptyCode).to.be(compiler.compileCode(emptyCode));
    });

    it('should return the code compiled from js to js', function() {
      var codes = ["var foo;", "function() { console.log('bar');", "{a: 1, b: 2}"];
      for (var key in codes) {
        var code = codes[key];
        expect(code).to.be(compiler.compileCode(code));
      }
    });
  });
});
