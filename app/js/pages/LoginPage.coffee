Page = require "../Page"
context = require '../context'
SiteMapPage = require './SiteMapPage'
utils = require './utils'
SignupPage = require './SignupPage'

module.exports = class LoginPage extends Page
  events:
    'click #signup_button' : 'signupClicked'
    'submit #form_login' : 'loginClicked'
    'click #demo_button' : 'demoClicked'
    "change #locale": "setLocale"
    "click .social-login": 'socialLogin'

  socialLogin: (ev) ->
    # First check connectivity
    $.get(@apiUrl + "ping").done () =>
      # Get provider
      provider = $(ev.currentTarget).data('provider')

      # Perform a social login with specified provider ("google", "facebook", etc.) 
      # Redirect to self with login token in hash
      loginTokenUrl = window.location.href.split("#")[0] + "#login_token/LOGIN_TOKEN";
      socialLoginUrl = @apiUrl + "auth/#{provider}?destUrl=" + encodeURIComponent(loginTokenUrl)
      window.location.href = socialLoginUrl
    .fail ()=>
      alert(T("Unable to sign in. Please check that you are connected to Internet"))

  activate: ->
    @setTitle ""

    # If login token in hash
    if window.location.hash and window.location.hash.match(/^#login_token/)
      # Get login token
      loginToken = window.location.hash.match(/#login_token\/(.+)/)[1]

      # Reset hash
      window.location.hash = ""

      success = =>
        @pager.closeAllPages(SiteMapPage)
        @pager.flash T("Login as {0} successful", @ctx.login.user), "success"

      error = => # Do nothing
      utils.login(null, null, loginToken, @ctx, success, error)
      return

    @render()

  render: ->
    @$el.html require('./LoginPage.hbs')(locales: @localizer.getLocales())

    # Select current locale
    @$("#locale").val(@localizer.locale)

  setLocale: ->
    @localizer.locale = @$("#locale").val()
    @localizer.saveCurrentLocale()
    @render()

  signupClicked: ->
    # Open signup form
    @pager.openPage(SignupPage)

  login: (username, password) ->
    success = =>
      @pager.closeAllPages(SiteMapPage)
      @pager.flash T("Login as {0} successful", username), "success"

    error = =>
      $("#login_button").removeAttr('disabled')

    # Disable button temporarily
    $("#login_button").attr("disabled", "disabled")

    utils.login(username, password, null, @ctx, success, error)

  loginClicked: (e) ->
    # Prevent actual submit
    e.preventDefault()

    username = @$("#login_username").val().trim()
    password = @$("#login_password").val().trim()

    @login(username, password)
    return

  demoClicked: ->
    # Update context, first stopping old one
    @ctx.stop()
    context.createDemoContext (ctx) =>
      _.extend @ctx, ctx

      @pager.closePage(SiteMapPage)
      @pager.flash T("Running in Demo mode. No changes will be saved"), "warning", 10000
