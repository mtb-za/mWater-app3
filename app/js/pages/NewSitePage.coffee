Page = require '../Page'
forms = require '../forms'
SourcePage = require "./SourcePage"
siteTypes = require '../common/siteTypes'

# Allows creating of a site
# Options are geo to initialize the geo of the site
module.exports = class NewSitePage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sites")

  activate: ->
    @setTitle T("New Site")

    # Create model for the site
    @model = new Backbone.Model(setLocation: not @options.geo?)
  
    # Create questions
    siteTypesQuestion = new forms.DropdownQuestion
      id: 'type'
      model: @model
      prompt: T('Enter Site Type')
      options: []

    siteTypesQuestion.setOptions _.map(siteTypes[0].subtypes, (st) => [st, T(st)] )

    contents = []

    contents.push siteTypesQuestion

    contents.push new forms.TextQuestion
      id: 'name'
      model: @model
      prompt: T('Enter optional name')

    contents.push new forms.TextQuestion
      id: 'desc'
      model: @model
      prompt: T('Enter optional description')

    contents.push new forms.CheckQuestion
      id: 'private'
      model: @model
      prompt: T("Privacy")
      text: T('Site is private')
      hint: T('This should only be used for sites that are not publicly accessible')

    if not @options.geo?
      contents.push new forms.RadioQuestion
        id: 'setLocation'
        model: @model
        prompt: T('Set to current location?')
        options: [[true, 'Yes'], [false, 'No']]

    saveCancelForm = new forms.SaveCancelForm
      contents: contents

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      site = _.pick(@model.toJSON(), 'name', 'desc')

      site.type = ["Water Point", @model.get('type')]
      
      # Set roles based on privacy
      if @model.get("private")
        site.roles = [
          { id: "user:#{this.login.user}", role: "admin" }
        ]
      else
        site.roles = [
          { id: "user:#{this.login.user}", role: "admin" }
          { id: "all", role: "view" }
        ]

      success = (code) =>
        site.code = code

        # Set geo is present in options
        if @options.geo?
          site.geo = @options.geo

        if @options.location?
          site.location = @options.location          

        @db.sites.upsert site, (site) => 
          @pager.closePage(SourcePage, { _id: site._id, setLocation: @model.get('setLocation'), onSelect: @options.onSelect })
        , @error

      error = =>
        alert(T("Unable to generate site id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range."))

      @siteCodesManager.requestCode(success, error)

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
 