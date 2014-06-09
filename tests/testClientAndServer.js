test('using both client and the server', function(done, server, client) {
  server.eval(function() {
    Donate.find().observe({
      added: addedNewDonation
    });

    function addedNewDonation(donate) {
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