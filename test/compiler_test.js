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
  var sampleCodes;

  before(function() {
    sampleCodes = [
      "var foo;",
      "function() { console.log('bar');",
      "{a: 1, b: 2}"
    ];
    baseDir         = "tmp_resources";
    fileFoo         = baseDir + "/foo.js";
    fileBar         = baseDir + "/bar.js";
    nonExistingFile = baseDir + "/newFile.js";
    fileFooContent  = "console.log('foo');";
    fileBarContent  = "console.log('bar');";
  });

  beforeEach(function() {
    compiler        = new Compiler.Js2JsCompiler(console.log, false, false);
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
      expect(ret.ok).to.equal(false);
      expect(ret.status).to.contain('already js2js-compiled');
      expect(fs.readFileSync(fileFoo).toString()).to.equal(fileFooContent);
    });

    it('should fail on existing file when not force', function() {
      var ret = compiler.compile(fileBar, fileFoo);
      expect(ret.ok).to.equal(false);
      expect(ret.status).to.contain('location already exists');
      expect(fs.readFileSync(fileFoo).toString()).to.equal(fileFooContent);
    });

    it('should compile existing file when force', function() {
      compiler._forceOverwrite = true;
      var expectedOutput       = compiler.compileCode(fileBarContent);
      var ret                  = compiler.compile(fileBar, fileFoo);
      expect(ret.ok).to.equal(true);
      expect(fs.readFileSync(fileFoo).toString()).to.equal(expectedOutput);
    });

    it('should fail on symlinks', function() {
      var fooSymlink = "fooLink.js";
      fs.symlinkSync(fileFoo, fooSymlink);
      var ret = compiler.compile(fooSymlink, nonExistingFile);
      expect(ret.ok).to.equal(false);
      expect(ret.status).to.contain('location should be both');
      fs.unlinkSync(fooSymlink);
    });
  });

  describe('#compileCode()', function() {
    it('should accept empty code', function() {
      var emptyCode = '';
      expect(emptyCode).to.equal(compiler.compileCode(emptyCode));
    });

    it('should return the code compiled from js to js', function() {
      for (var key in sampleCodes) {
        var code = sampleCodes[key];
        expect(code).to.equal(compiler.compileCode(code));
      }
    });
  });

  describe('#decompile()', function() {
    it('should be transitive with compile', function() {
      var compiledFile = nonExistingFile;
      var reversedFile = baseDir + "/reversed.js";
      compiler.compile(fileFoo, compiledFile);
      compiler.decompile(compiledFile, reversedFile);
      var reversedCode = fs.readFileSync(reversedFile).toString();
      expect(reversedCode).to.equal(fileFooContent);
      fs.unlinkSync(reversedFile);
      fs.unlinkSync(compiledFile);
    });
  });
});
