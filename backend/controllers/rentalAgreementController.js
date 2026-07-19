const model = require("../models/rentalAgreementModel");

function parseAgreement(body) {
  return {
    stallId: Number(body.stallId),
    stallNumber: String(body.stallNumber || "").trim(),
    monthlyRent: Number(body.monthlyRent),
    stallSizeSqFt: Number(body.stallSizeSqFt),
    startDate: body.startDate,
    endDate: body.endDate,
    status: body.status || "Active",
  };
}
function validate(data, includeStall = true) {
  if (includeStall && (!Number.isInteger(data.stallId) || data.stallId <= 0)) return "Select a valid stall.";
  if (!data.stallNumber) return "Stall number is required.";
  if (!Number.isFinite(data.monthlyRent) || data.monthlyRent <= 0) return "Monthly rent must be greater than 0.";
  if (!Number.isInteger(data.stallSizeSqFt) || data.stallSizeSqFt <= 0) return "Stall size must be a positive whole number.";
  if (!data.startDate || !data.endDate || new Date(data.endDate) < new Date(data.startDate)) return "End date must be on or after start date.";
  if (!["Active","Expired","Terminated","Pending"].includes(data.status)) return "Invalid agreement status.";
  return null;
}

async function list(req,res,next){ try { res.json(await model.getVendorAgreements(req.user.userId)); } catch(e){next(e);} }
async function stalls(req,res,next){ try { res.json(await model.getVendorStalls(req.user.userId)); } catch(e){next(e);} }
async function getOne(req,res,next){ try { const item=await model.getAgreementById(Number(req.params.id),req.user.userId); if(!item)return res.status(404).json({error:"Rental agreement not found."}); res.json(item);}catch(e){next(e);} }
async function create(req,res,next){ try { const data=parseAgreement(req.body); const error=validate(data); if(error)return res.status(400).json({error}); res.status(201).json(await model.createAgreement(req.user.userId,data)); }catch(e){ if(e.status)return res.status(e.status).json({error:e.message}); next(e);} }
async function update(req,res,next){ try { const data=parseAgreement(req.body); const error=validate(data,false); if(error)return res.status(400).json({error}); const item=await model.updateAgreement(Number(req.params.id),req.user.userId,data); if(!item)return res.status(404).json({error:"Rental agreement not found."}); res.json(item);}catch(e){next(e);} }
async function remove(req,res,next){ try { const ok=await model.deleteAgreement(Number(req.params.id),req.user.userId); if(!ok)return res.status(404).json({error:"Rental agreement not found."}); res.status(204).send(); }catch(e){next(e);} }
module.exports={list,stalls,getOne,create,update,remove};