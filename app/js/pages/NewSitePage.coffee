Page = require '../Page'
forms = require 'mwater-forms'
SitePage = require "./SitePage"
commonUI = require './commonUI'
GeoJSON = require '../GeoJSON'

# Allows creating of a site
# Options are geo to initialize the geo of the site
module.exports = class NewSitePage extends Page
  @canOpen: (ctx) -> ctx.auth.insert("sites")

  activate: ->
    @setTitle T("New Site")

    # Create model for the site
    @model = new Backbone.Model({ 
      location: { value: @options.location }
      private: {}
      name: {}
      desc: {}
      type: {}
    })
  
    contents = commonUI.createBasicSiteQuestions(@model)

    contents.push new forms.CheckQuestion
      id: 'private'
      model: @model
      prompt: T("Privacy")
      label: T('Site is private')
      hint: T('This should only be used for sites that are not publicly accessible')

    saveCancelForm = new forms.SaveCancelForm
      T: T
      contents: contents

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      site = {}
      site.name = @model.get("name").value
      site.desc = @model.get("desc").value
      site.type = []
      site.type[0] = @model.get("type").value
      if @model.get("subtype") and @model.get("subtype").value
        site.type[1] = @model.get("subtype").value
      site.location = @model.get("location").value
      if site.location
        site.geo = GeoJSON.locToPoint(site.location)

      # Set roles based on privacy
      if @model.get("private").value
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
          @pager.closePage(SitePage, { _id: site._id, setLocation: @model.get('setLocation'), onSelect: @options.onSelect })
        , @error

      error = =>
        alert(T("Unable to generate site id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range."))

      @siteCodesManager.requestCode(success, error)

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
 