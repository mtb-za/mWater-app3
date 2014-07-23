
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
  # user is username, groups is list of group names
  constructor: (user, groups) ->
    @user = user
    @groups = groups

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

    # Legacy support
    if col in ['source_notes', 'tests']
      return doc.user == @user

    return _.any doc.roles, (r) =>
      if r.id == "user:#{this.user}" and r.role == "admin"
        return true
      if r.id in _.map(@groups, (g) -> "group:#{g}") and r.role == "admin"
        return true
      return false

  remove: (col, doc) ->
    return @update(col, doc)
