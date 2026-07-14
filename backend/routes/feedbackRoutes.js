const express = require("express");
const feedbackController = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", feedbackController.createFeedback);

router.get("/stall/:stallId", feedbackController.getFeedbackByStall);

router.get("/stall/:stallId/summary", feedbackController.getRatingSummary);

router.put("/:feedbackId", feedbackController.updateFeedback);

router.delete("/:feedbackId", feedbackController.deleteFeedback);

module.exports = router;
