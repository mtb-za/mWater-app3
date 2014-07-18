Page = require '../Page'
forms = require 'mwater-forms'
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
        name: { value: site.name }
        desc: { value: site.desc }
        type: { value: site.type[0] }
        subtype: { value: site.type[1] }
      })

      # When type changes, clear subtype
      @model.on "change:type", =>
        @model.unset("subtype")

      # Create questions
      contents = []

      contents.push new forms.DropdownQuestion
        T: T
        id: 'type'
        model: @model
        prompt: T('Enter site type')
        choices: _.map(siteTypes, (st) => { id: st.name, label: T(st.name)})
        required: true

      # Create subtype questions
      for siteType in siteTypes
        if siteType.subtypes.length == 0
          continue

        do (siteType) =>
          contents.push new forms.DropdownQuestion
            T: T
            id: 'subtype'
            model: @model
            prompt: T('Enter optional site subtype')
            choices: _.map(siteType.subtypes, (st) => { id: st, label: T(st) })
            conditional: () =>
              return @model.get("type").value == siteType.name

      contents.push new forms.TextQuestion
        T: T
        id: 'name'
        model: @model
        prompt: T('Enter optional name')

      contents.push new forms.TextQuestion
        T: T
        id: 'desc'
        model: @model
        prompt: T('Enter optional description')

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

        @db.sites.upsert site, => 
          @pager.closePage()
        , @error 

      @listenTo saveCancelForm, 'cancel', =>
        @pager.closePage()
    , @error
 