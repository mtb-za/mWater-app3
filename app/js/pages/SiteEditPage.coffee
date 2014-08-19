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

      # Create site model from site
      @siteModel = new Backbone.Model({
        name: { value: site.name }
        desc: { value: site.desc }
        type: { value: site.type[0] }
        subtype: { value: site.type[1] }
        location: { value: site.location }
      })

      siteQuestions = commonUI.createBasicSiteQuestions(@siteModel)
      @siteQuestionsGroup = new forms.QuestionGroup(contents: siteQuestions)

      @$el.empty()
      @$el.append(@siteQuestionsGroup.el)

      # Create site attributes model from site
      updateSiteAttrQuestions = =>
        if @siteAttrQuestionsGroup
          @siteAttrQuestionsGroup.remove()

        @siteAttrModel = new Backbone.Model(site.attrs)

        @siteAttrModel.on "change", =>
          if @siteAttrQuestionsGroup.validate()
            site.attrs = @siteAttrModel.toJSON()
            @db.sites.upsert site, => 
              # Do nothing
              return 
            , @error 
   
        siteAttrQuestions = commonUI.createSiteAttributeQuestions(site.type, @siteAttrModel)
        @siteAttrQuestionsGroup = new forms.QuestionGroup(contents: siteAttrQuestions)
        @$el.append(@siteAttrQuestionsGroup.el)

      updateSiteAttrQuestions()

      @siteModel.on "change:type change:subtype", () =>
        # Reset attributes
        site.attrs = {}
        updateSiteAttrQuestions()

      @siteModel.on "change", =>
        if @siteQuestionsGroup.validate()
          site.name = @siteModel.get("name").value
          site.desc = @siteModel.get("desc").value
          site.type = []
          site.type[0] = @siteModel.get("type").value
          if @siteModel.get("subtype") and @siteModel.get("subtype").value
            site.type[1] = @siteModel.get("subtype").value
          site.location = @siteModel.get("location").value
          if site.location
            site.geo = GeoJSON.locToPoint(site.location)

          @db.sites.upsert site, =>
            # Do nothing
            return 
          , @error 
 
