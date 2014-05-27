
# Assembles packets received from bluetooth connection and writes packets
module.exports = class GPSLoggerPacketMgr
  constructor: (conn) ->
    _.extend @, Backbone.Events
    @conn = conn

    # Buffer of received data
    @buffer = ""

    # TODO unlisten?
    @listenTo conn, 'read', (data) =>
      @buffer += data.replace(/[\n\r]/g, "")
      @processBuffer()

  send: (id, data, success, error) ->
    # Pad with zeros
    pad = (num, size) ->
      s = "000000000" + num
      return s.substr(s.length-size)

    packet = "#" + id + pad(data.length, 5) + "," + data
    console.log "Send packet: #{packet}"
    @conn.write(packet, success, error)

  processBuffer: ->
    if @buffer.length > 0
      if @buffer[0] != "#"
        return @trigger "error", "Invalid packet start #{this.buffer[0]}"

    if @buffer.length >= 9
      len = parseInt(@buffer.substr(3, 5))

      if isNaN(len)
        return @trigger "error", "Invalid packet length #{len}"
        
      # Check length
      if @buffer.length >= len + 9
        # Extract packet
        packet = @buffer.substr(0, len + 9)

        @buffer = @buffer.substr(len + 9)
        @processPacket(packet)

        # Process further packets
        @processBuffer()

  processPacket: (packet) ->
    console.log "Receive packet: #{packet}"
    id = packet.substr(1, 2)
    data = packet.substr(9)
    @trigger 'receive', id, data

