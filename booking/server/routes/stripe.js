import express from "express";

const router = express.Router();

// contollers
import {
  createConnectAccount,
  getAccountStatus,
  getAccountBalance,
  payoutSetting,
  StripeSessionId,
} from "../controllers/stripe";
// middleware
import { requireSignin } from "../middlewares";

router.post("/create-connect-account", requireSignin, createConnectAccount);
router.post("/get-account-status", requireSignin, getAccountStatus);
router.post("/get-account-balance", requireSignin, getAccountBalance);
router.post("/payout-setting", requireSignin, payoutSetting);
router.post("/stripe-session-id", requireSignin, StripeSessionId);

module.exports = router;