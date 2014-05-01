Page = require "../Page"
mwaterforms = require 'mwater-forms'
ResponseModel = require '../ResponseModel'
ImagePage = require './ImagePage'
SourceListPage = require './SourceListPage'
SourceMapPage = require './SourceMapPage'
GeoJSON = require '../GeoJSON'

class SurveyPage extends Page
  @canOpen: (ctx) -> ctx.auth.update("responses")

  create: -> @render()

  render: ->
    @setTitle T("Survey")

    # Get response
    @db.responses.findOne {_id: @options._id}, (response) =>
      if not response
        alert(T("Test not found"))
        return @pager.closePage()

      @response = response

      # Get form
      @db.forms.findOne { _id: response.form }, (form) =>
        if not form
          alert T("Survey form not found")
          @pager.closePage()
          return

        # Get user groups
        @db.groups.find({ members: @login.user }, { fields: { groupname: 1 } }).fetch (groups) =>
          @responseModel = new ResponseModel(response, form, @login.user, _.pluck(groups, "groupname"))

          if @responseModel.canDelete()
            @setupContextMenu [ { glyph: 'remove', text: T("Delete Survey"), click: => @removeResponse() } ]
          else 
            @setupContextMenu [ ]

          # Render survey page
          canRedraft = @responseModel.canDraft()
          name = mwaterforms.formUtils.localizeString(form.design.name)

          @$el.html require('./SurveyPage.hbs')(response: response, name: name, canRedraft: canRedraft)

          # Check if redraftable
          if response.status == "draft" or response.status == "rejected"
            model = new Backbone.Model()
            compiler = new mwaterforms.FormCompiler(model: model, locale: @localizer.locale)

            # Create context for forms            
            ctx = {
              displayImage: (options) =>
                @pager.openPage(ImagePage, { id: options.id, onRemove: options.remove })
              imageManager: @ctx.imageManager
              imageAcquirer: @ctx.imageAcquirer
              selectSite: (success) =>
                @pager.openPage SourceListPage, { onSelect: (source)=> success(source.code) }
              displayMap: (location) =>
                @pager.openPage require("./SourceMapPage"), {
                  initialGeo: { type: 'Point', coordinates: [location.longitude, location.latitude] }
                }
            }

            @formView = compiler.compileForm(form.design, ctx).render()
            
            # Listen to events
            @listenTo @formView, 'change', @save
            @listenTo @formView, 'complete', @completed
            @listenTo @formView, 'close', @close
            @listenTo @formView, 'discard', @removeResponse
          else
            @formView = new Backbone.View() # TODO?
            @formView.load = ->
              return
            if @response.status == "final"
              @formView.$el.html("<em>Response has been finalized and cannot be edited</em>") # TODO
            else
              @formView.$el.html("<em>Response is pending approval</em>") # TODO

          # Add form view
          @$("#contents").append(@formView.el)

          if not canRedraft or response.status in ['draft', 'rejected']
            @$("#edit_button").hide()

          @formView.load @response.data


  events:
    "click #edit_button" : "edit"

  activate: ->
    # Do not reload as form may have launched another page
    # and needs to keep its state

  destroy: ->
    # Let know that saved if closed incompleted
    if @response and @response.status == "draft"
      @pager.flash T("Survey saved as draft.")

    # Remove survey control
    if @formView?
      @formView.remove()

  edit: ->
    # Redraft
    @responseModel.draft()
    @db.responses.upsert @response, => @render()

  save: =>
    # Save to db
    @response.data = @formView.save()
    @db.responses.upsert(@response)

  close: ->
    @save()
    @pager.closePage()

  completed: =>
    # Submit
    @response.data = @formView.save()
    @responseModel.submit()

    @db.responses.upsert(@response)
    @pager.closePage()
    @pager.flash T("Survey completed successfully"), "success"

  removeResponse: ->
    if @auth.remove("responses", @response) and confirm(T("Permanently delete survey?"))
      @db.responses.remove @response._id, =>
        @response = null
        @pager.closePage()
        @pager.flash T("Survey deleted"), "warning"

module.exports = SurveyPage