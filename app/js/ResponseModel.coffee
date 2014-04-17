mwaterforms = require 'mwater-forms'

# Model of a response object that allows manipulation and asking of questions
module.exports = class ResponseModel
  constructor: (response, form, user, groups) ->
    @response = response
    @form = form
    @user = user
    @groups = groups

  # Setup draft
  draft: ->
    if not @response._id
      @response._id = mwaterforms.formUtils.createUid()
      @response.form = @form._id
      @response.user = @user
      @response.startedOn = new Date().toISOString()
  
      # Create code. Not unique, but unique per user if logged in once.
      @response.code = @user + "-" + mwaterforms.formUtils.createBase32TimeCode(new Date())
    
    @response.formRev = @form._rev
    @response.status = "draft"

    # Select deployment
    subjects = ["user:" + @user]
    subjects = subjects.concat(_.map @groups, (g) -> "group:" + g)
    deployment = _.find @form.deployments, (dep) =>
      return _.intersection(dep.enumerators, subjects).length > 0
    if not deployment
      throw new Error("No matching deployments")
    @response.deployment = deployment._id

    # Add self as admin
    @response.roles = [{ id: "user:" + @user, role: "admin"}]

    # Get list of admins at both deployment and form level
    admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins)
    admins = _.without(admins, "user:" + @user)

    @response.roles = @response.roles.concat _.map(admins, (id) -> { id: id, role: "admin"})

  # Submit (either to final or pending as appropriate)
  submit: ->
    @response.submittedOn = new Date().toISOString()

    deployment = _.findWhere(@form.deployments, { _id: @response.deployment })
    if not deployment
      throw new Error("No matching deployments")

    # If no approval stages
    if deployment.approvalStages.length == 0
      @_finalize(deployment)
    else
      @response.status = "pending"
      @response.approvalStage = 0

      # Add self as viewer
      @response.roles = [{ id: "user:" + @user, role: "admin"}]

      # Get list of admins at both deployment and form level and add approvers
      admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins, deployment.approvalStages[0].approvers)
      admins = _.without(admins, "user:" + @user)

      @response.roles = @response.roles.concat _.map(admins, (id) -> { id: id, role: "admin"})

  # Approve response
  approve: ->
    deployment = _.findWhere(@form.deployments, { _id: @response.deployment })
    if not deployment
      throw new Error("No matching deployments")

    if not @response.approvalStage? or @response.status != "pending"
      throw new Error("Not pending")

    # Check if last stage
    if @response.approvalStage == deployment.approvalStages.length - 1
      @_finalize(deployment)
    else
      @response.approvalStage += 1

      # Add self as viewer
      @response.roles = [{ id: "user:" + @user, role: "admin"}]

      # Get list of admins at both deployment and form level and add approvers
      admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins, deployment.approvalStages[@response.approvalStage].approvers)
      admins = _.without(admins, "user:" + @user)

      @response.roles = @response.roles.concat _.map(admins, (id) -> { id: id, role: "admin"})

  # Reject a response with a specific rejection message
  reject: (message) ->
    deployment = _.findWhere(@form.deployments, { _id: @response.deployment })
    if not deployment
      throw new Error("No matching deployments")

    if not @response.approvalStage? or @response.status != "pending"
      throw new Error("Not pending")

    @response.status = "rejected"
    @response.rejectionMessage = message
    delete @response.approvalStage

    # Add self as admin
    @response.roles = [{ id: "user:" + @user, role: "admin"}]

    # Get list of admins at both deployment and form level
    admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins)
    admins = _.without(admins, "user:" + @user)

    @response.roles = @response.roles.concat _.map(admins, (id) -> { id: id, role: "admin"})

  # Determine if can approve response
  canApprove: ->
    deployment = _.findWhere(@form.deployments, { _id: @response.deployment })
    if not deployment
      throw new Error("No matching deployments")

    if not @response.approvalStage? or @response.status != "pending"
      return false

    # Get list of admins at both deployment and form level and add approvers
    admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins, deployment.approvalStages[@response.approvalStage].approvers)
    subjects = ["user:" + @user]
    subjects = subjects.concat(_.map @groups, (g) -> "group:" + g)

    if _.intersection(admins, subjects).length > 0
      return true
    return false

  _finalize: (deployment) ->
    @response.status = "final"

    delete @response.approvalStage
    
    # Add self as viewer
    @response.roles = [{ id: "user:" + @user, role: "view"}]

    # Get list of admins at both deployment and form level
    admins = _.union(_.pluck(_.where(@form.roles, { role: "admin"}), "id"), deployment.admins)
    admins = _.without(admins, "user:" + @user)

    @response.roles = @response.roles.concat _.map(admins, (id) -> { id: id, role: "admin"})

    # Add viewers
    viewers = _.difference(deployment.viewers, admins)
    viewers = _.without(viewers, "user:" + @user)
    @response.roles = @response.roles.concat _.map(viewers, (id) -> { id: id, role: "view"})


