const model = require("../models/inspectionModel");

function parse(body) {
  return {
    stallId: Number(body.stallId),
    inspectionDate: body.inspectionDate,
    score: Number(body.score),
    grade: String(body.grade || "").toUpperCase(),
    remarks: String(body.remarks || "").trim(),
  };
}
function validate(data, needsStall=true) {
  if (needsStall && (!Number.isInteger(data.stallId) || data.stallId <= 0)) return "Select a valid stall.";
  if (!data.inspectionDate) return "Inspection date is required.";
  if (!Number.isInteger(data.score) || data.score < 0 || data.score > 100) return "Score must be a whole number from 0 to 100.";
  if (!["A","B","C","D"].includes(data.grade)) return "Grade must be A, B, C or D.";
  return null;
}
async function stalls(req,res,next){try{res.json(await model.getAllStallsForOfficer());}catch(e){next(e);}}
async function history(req,res,next){try{res.json(await model.getHistoryForStall(Number(req.params.stallId)));}catch(e){next(e);}}
async function vendorHistory(req,res,next){try{res.json(await model.getVendorHistory(req.user.userId));}catch(e){next(e);}}
async function getOne(req,res,next){try{const item=await model.getById(Number(req.params.id));if(!item)return res.status(404).json({error:"Inspection record not found."});res.json(item);}catch(e){next(e);}}
async function create(req,res,next){try{const data=parse(req.body);const error=validate(data);if(error)return res.status(400).json({error});res.status(201).json(await model.create(req.user.userId,data));}catch(e){next(e);}}
async function update(req,res,next){try{const data=parse(req.body);const error=validate(data,false);if(error)return res.status(400).json({error});const item=await model.update(Number(req.params.id),req.user.userId,data);if(!item)return res.status(404).json({error:"Inspection record not found."});res.json(item);}catch(e){next(e);}}
module.exports={stalls,history,vendorHistory,getOne,create,update};
