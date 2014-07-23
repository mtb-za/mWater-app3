Page = require '../Page'
forms = require 'mwater-forms'
commonUI = require './commonUI'
GeoJSON = require '../GeoJSON'

# Allows editing of site details
module.exports = class SiteEditPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("sites")

  activate: ->
    @db.sites.findOne {_id: @options._id}, (site) =>
      # Check auth
      if not @auth.update("sites", site)
        return @pager.closePage()

      @setTitle T("Edit Site {0}", site.code)

      # Create model from site
      @model = new Backbone.Model({
        name: { value: site.name }
        desc: { value: site.desc }
        type: { value: site.type[0] }
        subtype: { value: site.type[1] }
        location: { value: site.location }
      })

      contents = commonUI.createBasicSiteQuestions(@model)

      saveCancelForm = new forms.SaveCancelForm
        T: T
        contents: contents

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        site.name = @model.get("name").value
        site.desc = @model.get("desc").value
        site.type = []
        site.type[0] = @model.get("type").value
        if @model.get("subtype") and @model.get("subtype").value
          site.type[1] = @model.get("subtype").value
        site.location = @model.get("location").value
        if site.location
          site.geo = GeoJSON.locToPoint(site.location)

        @db.sites.upsert site, => 
          @pager.closePage()
        , @error 

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
    , @error
 