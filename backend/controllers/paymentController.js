const paymentModel = require("../models/paymentModel");

async function list(req, res, next) {
    try {
        const payments =
            await paymentModel.getVendorPayments(req.user.userId);

        res.json(payments);
    }
    catch (error) {
        next(error);
    }
}

async function pay(req, res, next) {
    try {
        const payment =
            await paymentModel.markPaid(
                Number(req.params.id),
                req.user.userId,
                req.body.paymentMethod
            );

        if (!payment) {
            return res.status(404).json({
                error: "Payment not found."
            });
        }

        res.json(payment);
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    list,
    pay
};