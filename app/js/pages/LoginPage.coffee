Page = require "../Page"
context = require '../context'
MainPage = require("./MainPage")
login = require '../login'

module.exports = class LoginPage extends Page
  events:
    'click #signup_button' : 'signupClicked'
    'click #login_button' : 'loginClicked'
    'click #demo_button' : 'demoClicked'

  activate: ->
    @setTitle "Login"
    @$el.html templates['pages/LoginPage']()

  signupClicked: ->
    email = @$("#signup_email").val()
    username = @$("#signup_username").val()
    password = @$("#signup_password").val()

    url = @apiUrl + 'users/' + username
    req = $.ajax(url, {
      data : JSON.stringify({
        email: email
        password: password
      }),
      contentType : 'application/json',
      type : 'PUT'})

    req.done (data, textStatus, jqXHR) =>
      # Login
      @login(username, password)
    req.fail (jqXHR, textStatus, errorThrown) =>
      if jqXHR.status < 500
        alert(JSON.parse(jqXHR.responseText).error)
      else
        @error(jqXHR.responseText)

    return false

  login: (username, password) ->
    url = @apiUrl + 'clients'
    req = $.ajax(url, {
      data : JSON.stringify({
        username: username
        password: password
      }),
      contentType : 'application/json',
      type : 'POST'})

    req.done (data, textStatus, jqXHR) =>
      response = JSON.parse(jqXHR.responseText)
      client = response.client
      email = response.email
      org = response.org

      # Login 
      login.setLogin(response)

      # Update context
      context.setupLoginContext(@ctx, response)

      @pager.closePage(MainPage)
      @pager.flash "Login successful", "success"

    req.fail (jqXHR, textStatus, errorThrown) =>
      if jqXHR.status < 500
        alert(JSON.parse(jqXHR.responseText).error)
      else
        @error(jqXHR.responseText)

  loginClicked: ->
    username = @$("#login_username").val()
    password = @$("#login_password").val()

    @login(username, password)
    return false

  demoClicked: ->
    # Update context
    context.setupDemoContext(@ctx)

    @pager.closePage(MainPage)
    @pager.flash "Demo mode started", "warning"
    return false


