var express = require("express");
var request = require("request");
var bodyParser = require("body-parser");

var mongoose = require("mongoose");

var validation = require("validator");

var db = mongoose.connect(process.env.MONGODB_URI);
var Ticket = require("./models/ticket");


var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 5000));

// Server index page
app.get("/", function (req, res) {
  res.send("Deployed!");
});

function respondWithTTDetails(res, tickt,successStatusCd){
  res.status(successStatusCd);
  res.setHeader('Content-Type', 'application/json');
  var respJson = { id: tickt.id,
                   correlationId: tickt.correlationId||"",
                   description: tickt.description,
                   severity: tickt.severity,
                   type: tickt.type,
                   creationDate: tickt.creationDate,
                   targetResolutionDate:tickt.targetResolutionDate||"",
                   status: tickt.status,
                   subStatus:tickt.subStatus||"",
                   statusChangeReason:tickt.statusChangeReason||"",
                   statusChangeDate:tickt.statusChangeDate,
                   relatedParty:tickt.relatedParty,
                   relatedObject:tickt.relatedObject,
                   note:tickt.note   
                  };
  res.send(JSON.stringify(respJson));
}

function sendValidationErrors(res,msg,errorCode){
  res.status(errorCode);
  res.setHeader('Content-Type', 'text/html');
  res.send("<!DOCTYPE html>"
            +"<html>"
              +"<head>"
                +"<title>Error</title>"
              +"</head>"
              +"<body>"
                +"<pre>"+msg+"</pre>"
              +"</body>"
            +"</html>");
}


function getTicketDetails(res, ticketId, successStatusCd){
  Ticket.findOne({id: ticketId}, function(err,tickt) {
        if(err) {
            res.status(500).send("Database Issue :"+err);
        } else if(tickt){          
          respondWithTTDetails(res, tickt, successStatusCd);
        }
        else {
          sendValidationErrors(res,"Ticket# "+ticketId+" not found",404);
        }
    });
}

function updateTicket(res,ticketId,fieldToSet){
  Ticket.update({ id: ticketId},fieldToSet, function(err, tt){
      if(err) res.status(500).send("Database Issue :"+err);
      else {
        console.log("Ticket Updated");
      }
  });
}

// GET Ticket Details
app.get("/API/troubleTicket/:ID", function (req, res) {
  getTicketDetails(res,req.params.ID,200)
});

// GET Ticket Details by User ID
app.get("/API/troubleTicket/myTT/:UserID", function (req, res) {
  Ticket.find({'relatedParty.href': req.params.UserID, 'relatedParty.role': 'Originator'}).sort({'creationDate': 'desc'}).exec(function(err,tickts) {
        if(err) {
            res.status(500).send("Database Issue :"+err);
        } else if(tickts){             
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tickts));          
        }
        else {
          sendValidationErrors(res,"Ticket# "+ticketId+" not found",404);
        }
    });
});


// GET Open Ticket Details by User ID
app.get("/API/troubleTicket/myOpenTT/:UserID", function (req, res) {
  Ticket.find({'relatedParty.href': req.params.UserID, 'relatedParty.role': 'Originator', 'status':{$nin:[process.env.TT_STATUS_CLS,process.env.TT_STATUS_CNL]}}).sort({'creationDate': 'desc'}).exec( function(err,tickts) {
        if(err) {
            res.status(500).send("Database Issue :"+err);
        } else if(tickts){             
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tickts));          
        }
        else {
          sendValidationErrors(res,"Ticket# "+ticketId+" not found",404);
        }
    });
});


// GET Closed & Cancelled Ticket Details by User ID
app.get("/API/troubleTicket/myClosedTT/:UserID", function (req, res) {
  Ticket.find({'relatedParty.href': req.params.UserID, 'relatedParty.role': 'Originator', 'status':{$in:[process.env.TT_STATUS_CLS,process.env.TT_STATUS_CNL,process.env.TT_STATUS_RESOLVED]}}).sort({'creationDate': 'desc'}).exec( function(err,tickts) {
        if(err) {
            res.status(500).send("Database Issue :"+err);
        } else if(tickts){             
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tickts));          
        }
        else {
          sendValidationErrors(res,"Ticket# "+ticketId+" not found",404);
        }
    });
});




// PATCH Ticket Details
app.patch("/API/troubleTicket/:ID", function (req, res) {
  Ticket.findOne({id: req.params.ID}, function(err,tickt){
        if(err) {
            res.status(500).send("Database Issue :"+err);
        } 
        else {
        	if(tickt){
        		var validResolvedStatus = [process.env.TT_STATUS_CLS,process.env.TT_STATUS_CREATED];
	        	var otherValidFromStatus = [process.env.TT_STATUS_CREATED,process.env.TT_STATUS_ACK,process.env.TT_STATUS_WIP];
	          	var otherValidToStatus=[process.env.TT_STATUS_CNL];
	          	var ticketUpdated = false;

	          	if(req.body.description){
		            if(req.body.description!==tickt.description){
		              var fieldToSet = {$set:{description:req.body.description}};
		              updateTicket(res,tickt.id,fieldToSet);
		              ticketUpdated= true;
		            }  
	          	}
	          	if(req.body.severity){
		            if(req.body.severity!==tickt.severity){
		              var fieldToSet = {$set:{severity:req.body.severity}};
		              updateTicket(res,tickt.id,fieldToSet);
		              ticketUpdated=true;
		            }  
	          	}
	          	if(req.body.type){
		            if(req.body.type!==tickt.type){
		              var fieldToSet = {$set:{type:req.body.type}};
		              updateTicket(res,tickt.id,fieldToSet);
		              ticketUpdated=true;
		            }  
	          	}
	          	if(req.body.targetResolutionDate){
		            if(req.body.targetResolutionDate!==tickt.targetResolutionDate){
		              var fieldToSet = {$set:{targetResolutionDate:req.body.targetResolutionDate}};
		              updateTicket(res,tickt.id,fieldToSet);
		              ticketUpdated=true;
		            }  
	          	}
	          	if(req.body.status){
	          		var statusChangeValid = false;
	            	var fieldToSet = "";
		            if(req.body.status!==tickt.status){		              
		              if(tickt.status === process.env.TT_STATUS_RESOLVED){
		                if(validResolvedStatus.indexOf(req.body.status)> -1){
		                  fieldToSet = {$set:{status:req.body.status, statusChangeDate:new Date()}};    
		                  statusChangeValid=true;
		                  //ticketUpdateNeeded=true;
		                }
		              }
		              else if(otherValidFromStatus.indexOf(tickt.status)> -1){
		                if(otherValidToStatus.indexOf(req.body.status)> -1){
		                  var statusChangeReason = req.body.statusChangeReason||"";
		                  if(req.body.status === process.env.TT_STATUS_RESOLVED){
		                    fieldToSet = {$set:{status:req.body.status, statusChangeReason: statusChangeReason,statusChangeDate:new Date(),resolutionDate:new Date()}};    
		                  }
		                  else{
		                    fieldToSet = {$set:{status:req.body.status, statusChangeReason: statusChangeReason, statusChangeDate:new Date()}};      
		                  }
		                  statusChangeValid=true;
		                }
		              }		      
		            }  
		            if(statusChangeValid){
		                updateTicket(res,tickt.id,fieldToSet);
		                ticketUpdated=true;
		            } 
		            else
		            {
		            	var responseMsg = "Status change invalid\n";
                  var status=tickt.status;
                  if(status==='created'){
                    status='New, Yet to be picked up by an agent';
                  }
		            	responseMsg=responseMsg+"Current status of Ticket# "+tickt.id+" is "+status+"\n";
		            	if(validResolvedStatus.indexOf(req.body.status)> -1){
		            		responseMsg=responseMsg+" Only Resolved Tickets can be Closed or Reopened";
		            	}
		            	else if(otherValidToStatus.indexOf(req.body.status)> -1){
		            		responseMsg=responseMsg+" Only Open Tickets [Created/Acknowledged/WIP] can be Cancelled";
		            	}	
		                sendValidationErrors(res,responseMsg,400); 
		            } 
	          	}
	          	if(req.body.relatedParty){
		            var fieldToSet = {$push:{relatedParty:req.body.relatedParty}};
		            updateTicket(res,tickt.id,fieldToSet);
		            ticketUpdated=true;
	          	}
	          	if(req.body.relatedObject){
		            var fieldToSet = {$push:{relatedObject:req.body.relatedObject}};
		            updateTicket(res,tickt.id,fieldToSet);
		            ticketUpdated=true; 
	          	}
	          	if(req.body.note){
		            var fieldToSet = {$push:{note:req.body.note}};
		            updateTicket(res,tickt.id,fieldToSet);
		            ticketUpdated=true; 
	          	}
	          	if (ticketUpdated)  getTicketDetails(res,tickt.id,201);
        	}
        	else{
        		 sendValidationErrors(res,"Ticket# "+req.params.ID+" not found",404);
        	}    
        }
    });  
});


// Create a Ticket
app.post("/API/troubleTicket", function (req, res) {
  var ttno = Math.random()*(process.env.RANDOM_HIGH - process.env.RANDOM_LOW)+process.env.RANDOM_LOW;
  if(!req.body.description){
    sendValidationErrors(res,"Description can not be Empty",400);
  }
  else if(!req.body.severity){
    sendValidationErrors(res,"Severity can not be Empty",400);
  }
  else if(!req.body.type){
    sendValidationErrors(res,"Type can not be Empty",400);
  }
  else{
    var ticket = new Ticket ({
      id:process.env.TT_PREFIX+ttno,
      correlationId:req.body.correlationId,
      description:req.body.description,
      severity:req.body.severity,
      type:req.body.type,
      targetResolutionDate:req.body.targetResolutionDate,
      relatedParty:req.body.relatedParty,
      note:req.body.note
    });
    //insert Ticket object
    ticket.save((err,tt) => {
        if(err) res.status(500).send("Database Issue :"+err);
        else {
          respondWithTTDetails(res, tt,201);
        }
    });
  }  
});