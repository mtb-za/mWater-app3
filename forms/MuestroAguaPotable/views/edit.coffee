forms = require("forms")
model = new Backbone.Model()

questions = []

# Location information 

questions.push new forms.Instructions
  text: "Muestro de Agua Potable - Laboratorio Central de Control de Calidad del Agua"

questions.push new forms.SourceQuestion
  id: "source"
  model: model
  prompt: "Seleccione el código de la fuente de agua"
  ctx: options.ctx

#Water Quality

questions.push new forms.NumberQuestion
  id: "pH"
  model: model
  prompt: "pH"
  decimal: true

questions.push new forms.NumberQuestion
  id: "cloro_libre"
  model: model
  prompt: "Cloro Libre (mg/L)"
  decimal: true

questions.push new forms.NumberQuestion
  id: "cloro_total"
  model: model
  prompt: "Cloro Total (mg/L)"
  decimal: true

questions.push new forms.NumberQuestion
  id: "cond_elec"
  model: model
  prompt: "Electrical conductivity (mS/cm)"
  decimal: true

questions.push new forms.NumberQuestion
  id: "temperatura"
  model: model
  prompt: "Temperatura (°C)"
  decimal: true

return new forms.WaterTestEditView
  model: model
  contents: questions