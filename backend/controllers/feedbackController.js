const feedbackModel = require("../models/feedbackModel");

async function createFeedback(req, res) {
  try {
    const { orderId, customerId, stallId, rating, comments } = req.body;

    if (!orderId || !customerId || !stallId || !rating) {
      return res.status(400).json({
        error: "orderId, customerId, stallId and rating are required",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        error: "Rating must be an integer between 1 and 5",
      });
    }

    const newFeedback = await feedbackModel.createFeedback({
      orderId: Number(orderId),
      customerId: Number(customerId),
      stallId: Number(stallId),
      rating: numericRating,
      comments: comments?.trim() || null,
    });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      feedback: newFeedback,
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        error: "Feedback has already been submitted for this order",
      });
    }

    console.error("Create feedback error:", error);

    return res.status(500).json({
      error: "Unable to submit feedback",
    });
  }
}

async function getFeedbackByStall(req, res) {
  try {
    const stallId = Number(req.params.stallId);

    if (!Number.isInteger(stallId)) {
      return res.status(400).json({
        error: "Invalid stall ID",
      });
    }

    const feedback = await feedbackModel.getFeedbackByStallId(stallId);

    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Get feedback error:", error);

    return res.status(500).json({
      error: "Unable to retrieve feedback",
    });
  }
}

async function getRatingSummary(req, res) {
  try {
    const stallId = Number(req.params.stallId);

    if (!Number.isInteger(stallId)) {
      return res.status(400).json({
        error: "Invalid stall ID",
      });
    }

    const summary = await feedbackModel.getRatingSummary(stallId);

    return res.status(200).json(summary);
  } catch (error) {
    console.error("Get rating summary error:", error);

    return res.status(500).json({
      error: "Unable to retrieve rating summary",
    });
  }
}

async function updateFeedback(req, res) {
  try {
    const feedbackId = Number(req.params.feedbackId);
    const rating = Number(req.body.rating);
    const comments = req.body.comments?.trim() || null;

    if (!Number.isInteger(feedbackId)) {
      return res.status(400).json({
        error: "Invalid feedback ID",
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be an integer between 1 and 5",
      });
    }

    const updatedFeedback = await feedbackModel.updateFeedback(
      feedbackId,
      rating,
      comments,
    );

    if (!updatedFeedback) {
      return res.status(404).json({
        error: "Feedback not found",
      });
    }

    return res.status(200).json({
      message: "Feedback updated successfully",
      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("Update feedback error:", error);

    return res.status(500).json({
      error: "Unable to update feedback",
    });
  }
}

async function deleteFeedback(req, res) {
  try {
    const feedbackId = Number(req.params.feedbackId);

    if (!Number.isInteger(feedbackId)) {
      return res.status(400).json({
        error: "Invalid feedback ID",
      });
    }

    const deletedFeedback = await feedbackModel.deleteFeedback(feedbackId);

    if (!deletedFeedback) {
      return res.status(404).json({
        error: "Feedback not found",
      });
    }

    return res.status(200).json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Delete feedback error:", error);

    return res.status(500).json({
      error: "Unable to delete feedback",
    });
  }
}

module.exports = {
  createFeedback,
  getFeedbackByStall,
  getRatingSummary,
  updateFeedback,
  deleteFeedback,
};
