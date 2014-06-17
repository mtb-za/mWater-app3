# Mocks a bluetooth connection that can read and write data
# write("xyz") writes a string
# event read("xyz") is reception of a string
module.exports = class MockBluetoothConnection
  constructor: ->
    _.extend @, Backbone.Events

  write: (str, success, error) ->
    @written = str
    success()

  mockRead: (str) ->
    @trigger 'read', str