Page = require "../Page"
context = require '../context'
MainPage = require './MainPage'
login = require '../login'

module.exports = class LoginPage extends Page
  events:
    'submit #form_signup' : 'signupClicked'
    'submit #form_login' : 'loginClicked'
    'click #demo_button' : 'demoClicked'

  activate: ->
    @setTitle ""
    @$el.html templates['pages/LoginPage']()

  signupClicked: (e) ->
    # Prevent actual submit
    e.preventDefault()

    email = @$("#signup_email").val()
    username = @$("#signup_username").val()
    password = @$("#signup_password").val()

    if not username or username.length == 0
      alert("Username required")
      return

    if not password or password.length < 5
      alert("Password of at least 5 characters required")
      return

    if not email or email.length == 0
      alert("Email required")
      return

    url = @apiUrl + 'users/' + username
    req = $.ajax(url, {
      data : JSON.stringify({
        email: email
        password: password
      }),
      contentType : 'application/json',
      type : 'PUT'})

    # Disable button temporarily
    $("#signup_button").attr("disabled", "disabled")

    req.done (data, textStatus, jqXHR) =>
      # Login
      @login(username, password)
    req.fail (jqXHR, textStatus, errorThrown) =>
      $("#signup_button").removeAttr('disabled')
      console.error "Signup failure: #{jqXHR.responseText} (#{jqXHR.status})"
      if jqXHR.status < 500 and jqXHR.status >= 400
        alert(JSON.parse(jqXHR.responseText).error)
      else
        alert("Unable to signup. Please check that you are connected to Internet")

    return

  login: (username, password) ->
    console.log "Logging in as: #{username}/#{password}"

    url = @apiUrl + 'clients'
    req = $.ajax(url, {
      data : JSON.stringify({
        username: username
        password: password
        version: @version
      }),
      contentType : 'application/json',
      type : 'POST'})

    # Disable button temporarily
    $("#login_button").attr("disabled", "disabled")

    req.done (data, textStatus, jqXHR) =>
      console.log "Login response: " + jqXHR.responseText
      response = JSON.parse(jqXHR.responseText)

      # Login 
      login.setLogin(response)

      # Update context, first stopping old one
      @ctx.stop()
      _.extend @ctx, context.createLoginContext(response)

      @pager.closePage(MainPage)
      @pager.flash "Login as #{response.user} successful", "success"

    req.fail (jqXHR, textStatus, errorThrown) =>
      $("#login_button").removeAttr('disabled')
      console.error "Login failure: #{jqXHR.responseText} (#{jqXHR.status})"
      if jqXHR.status < 500 and jqXHR.status >= 400
        alert(JSON.parse(jqXHR.responseText).error)
      else
        alert("Unable to login. Please check that you are connected to Internet")

  loginClicked: (e) ->
    # Prevent actual submit
    e.preventDefault()

    username = @$("#login_username").val()
    password = @$("#login_password").val()

    @login(username, password)
    return

  demoClicked: ->
    # Update context, first stopping old one
    @ctx.stop()
    _.extend @ctx, context.createDemoContext()

    @pager.closePage(MainPage)
    @pager.flash "Running in Demo mode. No changes will be saved", "warning", 10000
    return false