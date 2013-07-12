Page = require "../Page"

module.exports = class LoginPage extends Page
  events:
    'click #signup_button' : 'signup'
    'click #login_button' : 'do_login'

  activate: ->
    @setTitle "Login"
    @$el.html templates['pages/LoginPage']()

  # TODO handle login. create context class
  signup: ->
    @pager.closePage()
    return false

  # Named to avoid conflict with ctx mixin
  do_login: ->
    @pager.closePage()
    return false
