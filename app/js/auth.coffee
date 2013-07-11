

exports.AllAuth = class AllAuth
  insert: (col) ->
    return true

  update: (col, doc) ->
    return true

  remove: (col, doc) ->
    return true
    
exports.NoneAuth = class NoneAuth
  insert: (col) ->
    return false

  update: (col, doc) ->
    return false

  remove: (col, doc) ->
    return false

exports.UserAuth = class UserAuth
  # user is username, org is org code
  constructor: (user, org) ->
    @user = user
    @org = org

    @editableCols = ['sources', 'source_notes', 'tests', 'responses']

  insert: (col) ->
    if not (col in @editableCols)
      return false
    return true

  update: (col, doc) ->
    if not (col in @editableCols)
      return false

    if doc.org and @org
      return doc.user == @user || doc.org == @org
    else
      return doc.user == @user

  remove: (col, doc) ->
    if not (col in @editableCols)
      return false

    if doc.org and @org
      return doc.user == @user || doc.org == @org
    else
      return doc.user == @user


    