# Miscellaneous testable utilities called by pages

login = require '../login'
context = require '../context'

# Sets all documents belonging to a user to another org
exports.changeUserOrgDocs = (db, user, org, success, error) ->
    processTables = (tables, user, org, success, error) =>
      if tables.length == 0
        return success()

      # Get first table
      table = db[_.first(tables)]
      table.find({ user: user }).fetch (rows) =>
        processRows = (rows) =>
          if rows.length == 0
            return processTables(_.rest(tables), user, org, success, error)
          row = _.first(rows)
          row.org = org
          table.upsert row, =>
            processRows(_.rest(rows))
        processRows(rows)

    # For each main table
    tables = ['sources', 'source_notes', 'tests', 'responses']
    processTables(tables, user, org, success, error)


exports.login = (username, password, ctx, success, error) ->
  console.log "Logging in as: #{username}/###"

  url = ctx.apiUrl + 'clients'
  req = $.ajax(url, {
    data : JSON.stringify({
      username: username
      password: password
      version: @version
    }),
    contentType : 'application/json',
    type : 'POST'})

  req.done (data, textStatus, jqXHR) =>
    console.log "Login response: " + jqXHR.responseText
    response = JSON.parse(jqXHR.responseText)

    # Login 
    login.setLogin(response)

    # Update context, first stopping old one
    ctx.stop()
    _.extend ctx, context.createLoginContext(response)

    success()

  req.fail (jqXHR, textStatus, errorThrown) =>
    console.error "Login failure: #{jqXHR.responseText} (#{jqXHR.status})"
    if jqXHR.status < 500 and jqXHR.status >= 400 and jqXHR.status != 404 # 404 means no connection sometimes
      alert(JSON.parse(jqXHR.responseText).error)
    else
      alert(T("Unable to login. Please check that you are connected to Internet"))
    error()

  