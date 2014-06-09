//tests/posts.js
var assert = require('assert');

suite('Donate', function() {
  test('in the server', function(done, server) {
    server.eval(function() {
      Donate.insert({fname: 'George'});
      var docs = Donate.find().fetch();
      emit('docs', docs);
    });

    server.once('docs', function(docs) {
      assert.equal(docs.length, 1);
      done();
    });
  });
});