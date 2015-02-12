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

      # If in Phonegap/Cordova, we can't redirect back to the file:/// url that runs the app
      # as the browser blocks local redirects. Instead, we need to run an InAppBrowser
      # that goes to the API's signin page and then catch the redirect via an event handler
      if window.cordova
        # Fake URL to catch on redirect
        loginTokenUrl = "http://xyzzy.com/#login_token/LOGIN_TOKEN" 
        socialLoginUrl = @apiUrl + "auth/#{provider}?destUrl=" + encodeURIComponent(loginTokenUrl)

        inAppBrowser = window.open(socialLoginUrl, "_blank", "location=no")
        inAppBrowser.addEventListener 'loadstart', (event) => 
          # Check for fictional redirect
          if event.url.match(/http:\/\/xyzzy\.com/)
            console.log event.url
            # Get login token
            loginToken = event.url.match(/#login_token\/(.+)/)[1]

            # Cover up login screen to prevent confusion
            @$("#cover").show()

            # Close browser
            inAppBrowser.close()

            @loginWithToken(loginToken)
      else
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
      @loginWithToken(loginToken)
      return

    @render()

  # Perform login with the specified login token
  loginWithToken: (loginToken) ->
    success = =>
      @$("#cover").hide()
      @pager.closeAllPages(SiteMapPage)
      @pager.flash T("Login as {0} successful", @ctx.login.user), "success"

    error = => 
      @$("#cover").hide()

    utils.login(null, null, loginToken, @ctx, success, error)

  render: ->
    @$el.html require('./LoginPage.hbs')(locales: @localizer.getLocales())

    # Select current locale
    @$("#locale").val(@localizer.locale)

    # Hide social logins if InAppBrowser is not available
    if @ctx.baseVersion and (@ctx.baseVersion.match(/^3\.[0-9]\./) or @ctx.baseVersion.match(/^3\.1[0-3]\./))
      @$("#social_logins").hide()

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
