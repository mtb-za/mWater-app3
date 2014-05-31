Page = require("../Page")

# Lists detected sensors
module.exports = class SensorListPage extends Page
  events: 
    'click tr.tappable' : 'sensorClicked'

  create: ->
    @setTitle T('Sensors')

  activate: ->
    if not window.bluetooth or not window.bluetooth.isConnectionManaged
      alert(T("Only available on Android app"))
      return @pager.closePage()

    # Start with no devices. Key by address
    @devices = {}

    # Store discovery attempt number
    @discoveryAttempt = 0

    @discoverDevices()
    @bluetoothError = null
    @render()

  deactivate: ->
    if @discovering
      window.bluetooth.stopDiscovery () =>
        # Do nothing
        @discovering = false
        return
      , (error) =>
        # Do nothing
        console.error "Error cancelling discovery process: #{error}"
        @discovering = false

  discoverDevices: ->
    @discovering = true
    @discoveryAttempt += 1
    window.bluetooth.startDiscovery(@onDeviceDiscovered, @onDiscoveryFinished, @onDiscoveryError)
    @render()

  onDiscoveryFinished: =>
    @discovering = false
    @render()
    @discoverDevices()

  onDiscoveryError: (error) =>
    @bluetoothError = T("Unable to connect to Bluetooth") + JSON.stringify(error)
    @render()

  onDeviceDiscovered: (device) =>
    # Ignore non-GPS loggers
    if not device.name.match(/^RNBT/)
      console.log "Ignoring #{device.name}"
      return

    # Make name friendly
    device.name = "Sparx GPS Logger"

    # Store discovery attempt number to cull old ones
    device.attempt = @discoveryAttempt
    @devices[device.address] = device
    @render()

  render: ->
    data = {
      devices: _.values(@devices)
      error: @bluetoothError
      attempt: @discoveryAttempt
    }
    @$el.html require('./SensorListPage.hbs')(data)

  sensorClicked: (ev) ->
    # Ensure use capitalized version
    @pager.openPage(require("./SensorPage"), { address: ev.currentTarget.id.toUpperCase() })
    return

