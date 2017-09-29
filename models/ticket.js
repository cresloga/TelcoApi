var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TicketSchema = new Schema({
  id: {type: String},
  correlationId: {type: String},
  description: {type: String},
  severity: {type: String},
  type: {type: String},
  creationDate: {type: Date,default: Date.now},
  targetResolutionDate: {type: Date},
  status: {type: String, default:process.env.TT_STATUS_CREATED},
  subStatus: {type: String},
  statusChangeReason: {type: String},
  statusChangeDate: {type: Date,default: Date.now},
  resolutionDate: {type: Date},
  relatedParty:[{
    href: {type: String},
    role:{type: String},
    name: {type: String},
    validFor:{type:String}
  }],
  relatedObject:[{
    involvement: {type: String},
    reference:{type: String}
  }],  
  note : [{
  	date: {type: Date,default: Date.now},
  	author:{type: String},
  	text: {type: String}
  }]
});

module.exports = mongoose.model("Ticket", TicketSchema);