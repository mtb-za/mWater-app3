forms = require("forms")
model = new Backbone.Model()

sections = []
questions = []

# Location information 

questions.push new forms.Instructions
  text: "Muestro de Agua Potable - Laboratorio Central de Control de Calidad del Agua"

questions.push new forms.SourceQuestion
  id: "source"
  model: model
  prompt: "Seleccione el código de la fuente de agua"
  ctx: options.ctx

questions.push new forms.TextQuestion
  id: "colonia"
  model: model
  prompt: "Colonia"

questions.push new forms.TextQuestion
  id: "delgacion"
  model: model
  prompt: "Delgación"

questions.push new forms.TextQuestion
  id: "clave_colonia"
  model: model
  prompt: "Clave Colonia"

questions.push new forms.TextQuestion
  id: "initial_portfolio"
  model: model
  prompt: "Initial Portfolio"

questions.push new forms.TextQuestion
  id: "final_portfolio"
  model: model
  prompt: "Final Portfolio"


questions.push new forms.DateQuestion
  id: "fecha"
  model: model
  prompt: "Fecha"


questions.push new forms.TextQuestion
  id: "clave_crucero" 
  model: model
  prompt: "Clave Crucero" 

questions.push new forms.TextQuestion
  id: "calle_1" 
  model: model
  prompt: "Calle 1" 

questions.push new forms.TextQuestion
  id: "calle_2" 
  model: model
  prompt: "Calle 2" 

questions.push new forms.TextQuestion
  id: "hora" 
  model: model
  prompt: "Hora" 


sections.push new forms.Section
  model: model
  title: "Información de la ubicación"
  contents: questions
questions = []


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
  prompt: "Temperatura"
  decimal: true



questions.push new forms.TextQuestion
  id: "folio"
  model: model
  prompt: "Folio"


sections.push new forms.Section
  model: model
  title: "Calidad del Agua"
  contents: questions
questions = []



# END HERE
view = new forms.Sections
  sections: sections
  model: model

return new forms.SurveyView
  model: model
  contents: [view]
