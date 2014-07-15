
# Authorization classes all follow same pattern.
# doc can be undefined in update and remove: authorizes whether ever possible.

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

    @editableCols = ['sites', 'source_notes', 'tests', 'responses']

  insert: (col) ->
    if not (col in @editableCols)
      return false
    return true

  update: (col, doc) ->
    if not (col in @editableCols)
      return false

    if not doc
      return true

    if doc.org and @org
      return doc.user == @user || doc.org == @org || @user == "admin"
    else
      return doc.user == @user || @user == "admin"

  remove: (col, doc) ->
    if not (col in @editableCols)
      return false

    if not doc
      return true

    if doc.org and @org
      return doc.user == @user || doc.org == @org || @user == "admin"
    else
      return doc.user == @user || @user == "admin" 


    