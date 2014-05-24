Page = require("../Page")

# Lists detected sensors
module.exports = class SensorListPage extends Page
  events: 
    'click tr.tappable' : 'sensorClicked'

  create: ->
    @setTitle T('Sensors')
    if not window.bluetooth or not window.bluetooth.isConnectionManaged
      alert(T("Only available on Android app"))
      return @pager.closePage()

    # Start with no devices. Key by address
    @devices = {}

  activate: ->
    window.bluetooth.getPaired (devices) =>
      for device in devices
        @addDevice(device)
      @render()
    , =>
      @bluetoothError = T("Unable to connect to Bluetooth")
      @render()

    @render()

  addDevice: (device) ->
    @devices[device.address] = device

  render: ->
    data = {
      devices: _.values(@devices)
      error: @bluetoothError
    }
    @$el.html require('./SensorListPage.hbs')(data)

  sensorClicked: (ev) ->
    @pager.openPage(require("./SensorPage"), { address: ev.currentTarget.id})
    return

