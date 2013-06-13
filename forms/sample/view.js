var forms = require("forms");
var model = new Backbone.Model();

var sections = [], questions = [];

questions.push(new forms.DropdownQuestion({
    id : "q1",
    model : model,
    required : true,
    prompt : "What is the type of facility?",

    options : [["PipedWater", "Piped Water"], ["PipedWaterRes", "Piped Water with Service Reservoir"], ["GravityFedPiped", "Gravity-fed Piped Water"], ["BoreholeMech", "Deep Borehole with Mechanized Pumping"], ["BoreholeHand", "Deep Borehole with Handpump"], ["ProtectedSpring", "Protected Spring"], ["DugWellPump", "Dug Well with Handpump/windlass"], ["TreatmentPlant", "Water Treatment Plant"]],
}));

sections.push(new forms.Section({
    model : model,
    title : "General Information",
    contents : questions
}));

var view = new forms.Sections({
    title : 'WHO UNICEF Sanitary Inspection and Pollution Risk Assessment',
    sections : sections,
    model : model
});

return new forms.Form({
    model: model,
    views: [view]
});
