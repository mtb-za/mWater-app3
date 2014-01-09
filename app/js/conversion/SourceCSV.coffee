CSV = require './CSV'

module.exports = class SourceCSV
  constructor: (validTypes=[]) ->
    @validTypes = validTypes

  # Imports source csv into source objects array
  import: (csv) ->
    # Convert data to raw arrays
    data = CSV.parse(csv)

    # For each row
    sources = []
    for row in _.rest(data)
      # Make into object
      obj = {}

      # For each column of header
      for i in [0...data[0].length]
        if row[i]?
          obj[data[0][i]] = row[i]

      # Strip _id
      obj = _.omit(obj, "_id")

      # Check type
      if obj.type
        if not _.contains(@validTypes, obj.type)
          throw new Error("Invalid type: " + obj.type)

      # Convert latitude longitude
      if obj.latitude and obj.longitude
        obj.latitude = parseFloat(obj.latitude)
        obj.longitude = parseFloat(obj.longitude)

        if isNaN(obj.latitude) or obj.latitude > 90 or obj.latitude < -90
          throw new Error("Invalid latitude: " + obj.latitude)
        if isNaN(obj.longitude) or obj.longitude > 180 or obj.longitude < -180
          throw new Error("Invalid longitude: " + obj.longitude)

        obj.geo = {
          type: "Point"
          coordinates: [obj.longitude, obj.latitude]
        }
      obj = _.omit(obj, "latitude", "longitude")

      # Convert private
      if obj.private == "true"
        obj.private = true
      else if obj.private?
        delete obj.private

      # Keep custom fields
      knownFields = ["name", "desc", "geo", "code", "type", "user", "org", "private"]
      custom = _.omit(obj, knownFields)
      obj = _.pick(obj, knownFields)
      if _.keys(custom).length > 0
        obj.custom = custom

      sources.push(obj)


    return sources
