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
      @model = new Backbone.Model({
        name: site.name
        desc: site.desc
        type: site.type[0]
        subtype: site.type[1]
      })

      # When type changes, clear subtype
      @model.on "change:type", =>
        @model.unset("subtype")

      # Create questions
      contents = []

      contents.push new forms.DropdownQuestion
        id: 'type'
        model: @model
        prompt: T('Enter Site Type')
        options: _.map(siteTypes, (st) => [st.name, T(st.name)])
        required: true

      # Create subtype questions
      for siteType in siteTypes
        if siteType.subtypes.length == 0
          continue

        do (siteType) =>
          contents.push new forms.DropdownQuestion
            id: 'subtype'
            model: @model
            prompt: T('Enter Site Subtype')
            hint: T("Optional")
            options: _.map(siteType.subtypes, (st) => [st, T(st)])
            conditional: () =>
              return @model.get("type") == siteType.name

      contents.push new forms.TextQuestion
        id: 'name'
        model: @model
        prompt: T('Enter optional name')

      contents.push new forms.TextQuestion
        id: 'desc'
        model: @model
        prompt: T('Enter optional description')

      saveCancelForm = new forms.SaveCancelForm
        contents: contents

      @$el.empty().append(saveCancelForm.el)

      @listenTo saveCancelForm, 'save', =>
        site.name = @model.get("name")
        site.desc = @model.get("desc")
        site.type[0] = @model.get("type")
        site.type[1] = @model.get("subtype")
        site.type = _.compact(site.type) # Remove undefined/null

        @db.sites.upsert site, => 
          @pager.closePage()
        , @error 

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
    , @error
 