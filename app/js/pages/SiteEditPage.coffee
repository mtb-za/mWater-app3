Page = require '../Page'
forms = require '../forms'
siteTypes = require '../common/siteTypes'

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
      @model = new Backbone.Model()

      # Set to subtype for now
      @model.set({
        name: site.name
        desc: site.desc
        type: site.type[1]
      })
  
      # Create questions
      siteTypesQuestion = new forms.DropdownQuestion
        id: 'type'
        model: @model
        prompt: T('Enter Site Type')
        options: []
      siteTypesQuestion.setOptions _.map(siteTypes[0].subtypes, (st) => [st, T(st)] )
      
      saveCancelForm = new forms.SaveCancelForm
        contents: [
          siteTypesQuestion
          new forms.TextQuestion
            id: 'name'
            model: @model
            prompt: T('Enter optional name')
          new forms.TextQuestion
            id: 'desc'
            model: @model
            prompt: T('Enter optional description')
        ]

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        site.name = @model.get("name")
        site.desc = @model.get("desc")
        site.type[1] = @model.get("type")

        @db.sites.upsert site, => 
          @pager.closePage()
        , @error 

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
    , @error
 