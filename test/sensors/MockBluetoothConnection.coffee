# Mocks a bluetooth connection that can read and write data
# write("xyz") writes a string
# event read("xyz") is reception of a string
module.exports = class MockBluetoothConnection extends Backbone.Events
  write: (str) ->
    @written = str

  mockRead: (str) ->
    @trigger 'read', str