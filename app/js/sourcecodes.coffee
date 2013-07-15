exports.seqToCode = (seq) ->
  # Get string of seq number
  str = "" + seq

  sum = 0
  for i in [0...str.length]
    digit = parseInt(str[str.length-1-i])
    if i%3 == 0
      sum += 7 * digit
    if i%3 == 1
      sum += 3 * digit
    if i%3 == 2
      sum +=  digit
  return str + (sum % 10)

exports.isValid = (code) ->
  seq = parseInt(code.substring(0, code.length - 1))

  return exports.seqToCode(seq) == code


exports.SourceCodeManager = class SourceCodeManager 
  # URL to obtain more codes from
  constructor: (url) ->
    @url = url

  # Gets list of cached source codes in form { code:<code>, expiry:<expiry in ISO datetime> }
  getLocalCodes: ->
    return []  unless localStorage.getItem("sourceCodes")
    JSON.parse localStorage.getItem("sourceCodes")
  
  # Sets list of cached source codes in form { code:<code>, expiry:<expiry in ISO datetime> }
  setLocalCodes: (codes) ->
    localStorage.setItem "sourceCodes", JSON.stringify(codes)
  
  # Purge expired code
  purgeCodes: (cutoff) ->
    @setLocalCodes _.reject(@getLocalCodes(), (item) ->
      item.expiry < cutoff
    )
  
  # Replenish codes from server to have a minimum of x available
  replenishCodes: (minNumber, success, error, cutoff) ->
    cutoff = cutoff or (new Date()).toISOString()
    
    # Purge old codes
    @purgeCodes cutoff
    
    # Determine how many are needed
    numNeeded = minNumber - @getLocalCodes().length
    
    # If have enough
    if numNeeded <= 0
      success()
      return
    
    # Request new codes
    req = $.ajax(@url, {
      data : JSON.stringify({ number: numNeeded }),
      contentType : 'application/json',
      type : 'POST'})
    req.done (data, textStatus, jqXHR) =>
      # Add to local storage
      @setLocalCodes @getLocalCodes().concat(data)
      success()
    req.fail (jqXHR, textStatus, errorThrown) =>
      if error
        error(errorThrown)

  getNumberAvailableCodes: (cutoff) ->
    cutoff = cutoff or (new Date()).toISOString()
    @purgeCodes cutoff
    @getLocalCodes().length

  requestCode: (success, error, cutoff) ->
    # Replenish codes to have at least one
    @replenishCodes 1, (=>
      codes = @getLocalCodes()
      
      # Remove first code
      @setLocalCodes _.rest(codes)
      success _.first(codes).code
    ), error, cutoff

  
  # Reset all codes cached
  reset: ->
    @setLocalCodes []