Package.describe({
  name: 'my-client-fixtures',
  summary: 'Client side fixtures for testing',
  version: '0.0.1',
  debugOnly: true
});


Package.on_use(function (api) {

  var SERVER = 'server',
      CLIENT = 'client',
      BOTH = [CLIENT, SERVER];

  api.versionsFrom('METEOR@1.0.3.2');

  api.use('mrgalaxy:stripe');

  api.addFiles('fixtures.js', [CLIENT]);
});
