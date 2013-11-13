# Miscellaneous testable utilities called by pages

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

