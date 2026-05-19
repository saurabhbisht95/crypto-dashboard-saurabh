import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toNumber } from "../utils/validators.js";
import { Alert } from "../models/Alert.model.js";
import { decorateAlerts, evaluateAlerts } from "../services/alert.service.js";

export const getAlerts = asyncHandler(async (req, res) => {
  await evaluateAlerts(req.user._id);
  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  const decoratedAlerts = await decorateAlerts(alerts);

  return res
    .status(200)
    .json(new ApiResponse(200, { alerts: decoratedAlerts }));
});

export const createAlert = asyncHandler(async (req, res) => {
  const { coinId, symbol, name, direction } = req.body;
  const targetPrice = toNumber(req.body.targetPrice);

  if (
    !coinId ||
    !symbol ||
    !name ||
    !["above", "below"].includes(direction) ||
    targetPrice <= 0
  ) {
    throw new ApiError(400, "Valid coin, target price, and direction are required.");
  }

  await Alert.create({
    user: req.user._id,
    coinId,
    symbol,
    name,
    targetPrice,
    direction,
  });

  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  const decoratedAlerts = await decorateAlerts(alerts);

  return res
    .status(201)
    .json(new ApiResponse(201, { alerts: decoratedAlerts }, "Alert created."));
});

export const deleteAlert = asyncHandler(async (req, res) => {
  await Alert.deleteOne({ _id: req.params.alertId, user: req.user._id });

  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  const decoratedAlerts = await decorateAlerts(alerts);

  return res
    .status(200)
    .json(new ApiResponse(200, { alerts: decoratedAlerts }, "Alert removed."));
});

export const toggleAlert = asyncHandler(async (req, res) => {
  const alert = await Alert.findOne({
    _id: req.params.alertId,
    user: req.user._id,
  });

  if (!alert) {
    throw new ApiError(404, "Alert not found.");
  }

  alert.active = !alert.active;

  if (alert.active) {
    alert.triggered = false;
    alert.triggeredAt = null;
  }

  await alert.save();

  const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
  const decoratedAlerts = await decorateAlerts(alerts);

  return res
    .status(200)
    .json(new ApiResponse(200, { alerts: decoratedAlerts }, "Alert updated."));
});
