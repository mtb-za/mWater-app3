Page = require "../Page"
ECPlates = require '../forms/ECPlates'
utils = require './utils'

class AdminPage extends Page
  @canOpen: (ctx) -> ctx.login? and ctx.login.user == 'admin'

  events: 
    "click #crash" : "crash"
    "click #change_password_button": "changePassword"
    "click #set_org_button": "setOrg"

  activate: ->
    @setTitle T("Admin")
    @render()

  render: ->
    @$el.html require('./AdminPage.hbs')()

  changePassword: ->
    username = @$("#password_username").val()
    password = @$("#new_password").val()

    # Change password
    req = $.ajax(@apiUrl + "users/#{username}?client=#{this.login.client}", {
      data : JSON.stringify({ password: password }),
      contentType : 'application/json',
      type : 'POST'})
    req.done (data, textStatus, jqXHR) =>
      alert("Success")
    req.fail (jqXHR, textStatus, errorThrown) =>
      alert("Failed: " + errorThrown)

  setOrg: ->
    username = @$("#org_username").val()
    newOrg = @$("#new_org").val()
    moveRows = @$("#update_row_orgs").hasClass("checked")

    # Change organization
    req = $.ajax(@apiUrl + "users/#{username}?client=#{this.login.client}", {
      data : JSON.stringify({ org: newOrg }),
      contentType : 'application/json',
      type : 'POST'})
    req.done (data, textStatus, jqXHR) =>
      # Update all rows if selected
      if moveRows
        utils.changeUserOrgDocs(@db, username, newOrg, ->
          alert("Success")
        , @error) 
      else
        alert("Success")
    req.fail (jqXHR, textStatus, errorThrown) =>
      alert("Failed: " + errorThrown)

  crash: ->
    setTimeout ->
      x = null
      x()
    , 100

module.exports = AdminPage