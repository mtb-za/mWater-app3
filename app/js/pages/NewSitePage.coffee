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
      privacy: {}
      name: {}
      desc: {}
      type: {}
      group: { value: _.first(@login.groups) }
    })
    
    # Default WaterAid to private
    if _.any(@login.groups, (g) -> g.match(/wateraid/i))
      @model.set("privacy", { value: "private" })

    contents = commonUI.createBasicSiteQuestions(@model)

    contents.push new forms.RadioQuestion
      id: 'privacy'
      model: @model
      prompt: T("Site privacy")
      choices: [
        { id: "public", label: T("Public"), hint: "Anyone can see and edit the site"}
        { id: "visible", label: T("Visible"), hint: "Anyone can see the site, but only you or your group can edit it"}
        { id: "private", label: T("Private"), hint: "Only you or your group can edit site"}
      ]
      required: true
      hint: T('Private should only be used for sites that are not publicly accessible')

    if @login.groups.length > 0
      choices = [{ id: "(none)", label: T("(No Group)") }]
      choices = choices.concat(_.map(@login.groups, (g) => { id: g, label: g }))
      contents.push new forms.DropdownQuestion
        id: 'group'
        model: @model
        prompt: T("Create site for group")
        required: true
        choices: choices

    saveCancelForm = new forms.SaveCancelForm
      T: T
      contents: contents

    @$el.empty().append(saveCancelForm.el)

    @listenTo saveCancelForm, 'save', =>
      site = {
        photos: []
        tags: []
      }
      site.name = @model.get("name").value
      site.desc = @model.get("desc").value
      site.type = []
      site.type[0] = @model.get("type").value
      if @model.get("subtype") and @model.get("subtype").value
        site.type[1] = @model.get("subtype").value
      site.location = @model.get("location").value
      if site.location
        site.geo = GeoJSON.locToPoint(site.location)

      # Set group
      group = @model.get("group").value
      if group == "(none)"
        group = null

      # Set who created for
      site.created = { by: @login.user }
      if group
        site.created.for = group

      # Set roles based on privacy
      if @model.get("privacy").value == "public"
        site.roles = [ { id: "all", role: "admin" } ]
      if @model.get("privacy").value == "visible"
        site.roles = [ { id: "all", role: "view" } ]
      else
        site.roles = [ ]

      if group
        site.roles.push { id: "group:#{group}", role: "admin" }
      else
        site.roles.push { id: "user:#{this.login.user}", role: "admin" }

      success = (code) =>
        site.code = code

        @db.sites.upsert site, (site) => 
          @pager.closePage(SitePage, { _id: site._id, onSelect: @options.onSelect })
        , @error

      error = =>
        alert(T("Unable to generate site id. Please ensure that you have a connection or use Settings to obtain more before going out of connection range."))

      @siteCodesManager.requestCode(success, error)

    @listenTo saveCancelForm, 'cancel', =>
      @pager.closePage()
