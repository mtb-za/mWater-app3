Page = require("../Page")

# Lists groups of which user is a member
module.exports = class GroupListPage extends Page
  @canOpen: (ctx) -> ctx.login?

  events: 
    'click .leave-group' : 'leaveClicked'

  create: ->
    @setTitle T('My Groups')

    @render()

  render: ->
    # Query list of groups
    @db.groups.find({ members: @login.user }, { }).fetch (groups) =>
      @groups = groups

      # Display list
      @$el.html require('./GroupListPage.hbs')(groups: groups)  
    , @error


  leaveClicked: (ev) ->
    groupname = $(ev.currentTarget).data("id")

    if not confirm(T("Leave the group '{0}'? Only a group admin can re-add you.", groupname))
      return

    # Find group
    group = _.findWhere(@groups, { groupname: groupname })

    # Remove member
    group.members = _.without(group.members, @login.user)

    # Upsert group
    @db.groups.upsert group, () =>
      if @updateGroupsList
        @updateGroupsList()
      @render()
