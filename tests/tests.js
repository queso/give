//tests/tests.js
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

  test('using both client and the server', function(done, server, client) {
    server.eval(function() {
      Donate.find().observe({
        added: addedNewDonate
      });

      function addedNewDonate(donate) {
        emit('donate', donate);
      }
    }).once('donate', function(donate) {
      assert.equal(donate.fname, 'George');
      done();
    });

    client.eval(function() {
      Donate.insert({fname: 'George'});
    });
  });

  test('using two clients', function(done, server, c1, c2) {
    c1.eval(function() {
      Donate.find().observe({
        added: addedNewDonate
      });

      function addedNewDonate(donate) {
        emit('donate', donate);
      }
      emit('done');
    }).once('donate', function(donate) {
      assert.equal(donate.fname, 'from c1');
      done();
    }).once('done', function() {
      c2.eval(insertDonate);
    });

    function insertDonate() {
      Donate.insert({fname: 'from c2'});
    }
  });
