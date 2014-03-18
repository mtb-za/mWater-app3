Page = require '../Page'
forms = require '../forms'

# Allows creating of a source
module.exports = class ProblemReportPage extends Page
  activate: ->
    @setTitle T("Report Problem")

    # Create model
    @model = new Backbone.Model()
    if @login
      @model.set('username', @login.user)
      @model.set('email', @login.email)
  
    questions = []

    questions.push new forms.TextQuestion
      id: 'username'
      model: @model
      prompt: T('Enter username')

    questions.push new forms.TextQuestion
      id: 'email'
      model: @model
      prompt: T('Enter email address')
    
    questions.push new forms.TextQuestion
      id: 'desc'
      model: @model
      prompt: T('Describe the problem')
      multiline: true

    saveCancelForm = new forms.SaveCancelForm
      contents: questions

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      report = @model.toJSON()
      report.version = @version
      report.baseVersion = @baseVersion
      report.user_agent = navigator.userAgent
      report.device = window.device
      report.url = window.location.href
      # TODO add log
      
      # Post to api
      url = @apiUrl + 'problem_reports' + (if (@login? and @login.client?) then "?client=" + @client else "")
      req = $.ajax(url, {
        data : JSON.stringify(report),
        contentType : 'application/json',
        type : 'POST'})

      req.done (data, textStatus, jqXHR) =>
        @pager.closePage()
        @pager.flash T("Report sent"), "success"
      req.fail (jqXHR, textStatus, errorThrown) =>
        @error(textStatus)

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
 