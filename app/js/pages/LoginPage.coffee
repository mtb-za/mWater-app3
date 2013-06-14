Page = require "../Page"

module.exports = class LoginPage extends Page
  events:
    'click #signup_button' : 'signup'
    'click #login_button' : 'login'

  activate: ->
    @setTitle "Login"
    @$el.html templates['pages/LoginPage']()

  signup: ->
    @pager.closePage()
    return false

  login: ->
    @pager.closePage()
    return false
