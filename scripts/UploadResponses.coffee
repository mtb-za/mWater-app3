fs = require 'fs'
JsonClient = require('request-json').JsonClient
uuid = require 'uuid'
sync = require 'synchronize'
read = require 'read'
_ = require 'lodash'
csv = require 'csv'

jsonClient = new JsonClient "http://api.mwater.co/v3/"

post = (path, data) ->
  df = sync.defer()
  jsonClient.post path, data, (err, res, body) ->
    df(err, {res: res, body: body, status: res.statusCode})
  return sync.await()

sync.fiber ->
  # Get user
  user = sync.await(read({ prompt: 'User: '}, sync.defer()))

  # Get password 
  client = null
  if user
    password = sync.await(read({ prompt: 'Password: ', silent: true}, sync.defer()))
    
    # Login 
    res = post "clients", { username: user, password: password }
    if res.status != 200
      console.error "Got #{res.status} code on login"
      throw new Error(res.body)
    client = res.body.client

  queryApi = (table, selector, options, callback) =>
    uri = "#{table}?" + "selector=" + encodeURIComponent(JSON.stringify(selector)) 
    if client
      uri += "&client=" + client
    if options.sort?
      uri += "&sort=" + encodeURIComponent(JSON.stringify(options.sort))

    jsonClient.get uri, (err, res, body) ->
      if res.statusCode != 200
        console.error(res.statusCode)
        console.error(body)
        throw new Error("Server error")

      callback(body)

  queryApiSync = (table, selector, options) =>
    df = sync.defer()
    queryApi table, selector, options, (res) =>
      df(null, res)
    return sync.await()

  upsertSync = (table, doc) ->
    df = sync.defer()
    jsonClient.post "#{table}?client=#{client}", doc, (err, res, body) ->
      if res.statusCode != 200
        console.error(res.statusCode)
        console.error(body)
        throw new Error("Server error")
      df(null, body)
    return sync.await()

  # ACTUAL CODE BEGINS
  rows = []
  csv().from("/home/clayton/Surveys.csv", { columns: true }).on("record", (row) => 
      rows.push(row)).on "end", =>
    sync.fiber ->
      n=0
      for row in rows
        doc = {
          "type" : "WaterAidWQSurvey",
          "type_rev" : 7,
          "started" : "2014-01-06T00:00:00.000Z",
          "completed" : "2014-01-06T00:00:00.000Z",
          "user" : "demo@wateraid.org",
          "org" : "WaterAid"
        }
        doc._id = uuid.v4().replace(/-/g, '')
        doc.data = row

        # Convert some columns to floats
        for col in ['pH', 'elec_conductivity_uS_cm', 'turbidity_NTU', 'TTC_CFU_100ml', 'Nitrate_as_NO3_mg_L', 'Nitrate_as_N_mg_L', 'arsenic', 'fluoride', 'iron', 'manganese', 'sodium', 'chloride', 'sulphate']
          val = parseFloat(doc.data[col])
          if not isNaN(val)
            doc.data[col] = val
          else
            doc.data[col] = undefined

        # Convert some columns to dates
        for col in ['date_install_or_rehab', 'date_tested']
          val = doc.data[col]
          val = val.replace(/\//g, "-")
          if val.match(/^\d{4}-\d{2}-\d{2}$/)
            doc.data[col] = val
          else
            doc.data[col] = undefined

        # Convert some columns to true/false
        for col in ['originally_WaterAid', 'tested', 'results_held_in_CP_office', 'all_within_national_limits']
          val = doc.data[col]
          if val == 'Yes'
            doc.data[col] = true
          else if val == 'No'
            doc.data[col] = false
          else 
            doc.data[col] = undefined

        console.log "Upserting #{n}"
        n = n + 1
        upsertSync "responses", doc
  #transform(console.log)

  # data = queryApiSync "sources", { org: "WaterAid" }, {}
  # codes = _.pluck(data, "code")
  # codes = _.map(codes, (x)=>parseInt(x))
  # codes.sort((a,b) => a-b)
  # fs.writeFileSync("codes.csv", codes.join("\n"))
  # console.log data.length
  #console.log JSON.stringify(data, null, 2)


