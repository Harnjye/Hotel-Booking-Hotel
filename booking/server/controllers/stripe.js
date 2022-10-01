import User from "../models/user";
import Stripe from "stripe";
import queryString from "query-string"

const stripe = Stripe(process.env.STRIPE_SECRET);

export const createConnectAccount = async (req, res) => {
  // 1. find user from db
  const user = await User.findById(req.user._id).exec();
  console.log("User ==>", user);
  // 2. if user don't have stripe_account_id yet, create now
  if (!user.stripe_account_id) {
    const account = await stripe.accounts.create({
      type: "express",
    });
    console.log("Acount ===>", account);
    user.stripe_account_id = account.id;
    user.save();
  }
  // 3. create login link based on acoount id (for frontend to complete onboarding)
  let accountLink = await stripe.accountLinks.create({
    account: user.stripe_account_id,
    refresh_url: process.env.STRIPE_REDIRECT_URL,
    return_url: process.env.STRIPE_REDIRECT_URL,
    type: "account_onboarding",
  });
  // prefill any such as email
  accountLink = Object.assign(accountLink, {
    "stripe_user[email]": user.email || undefined,
  });
  // console.log("ACCOUNT LINK", accountLink);
  let link = `${accountLink.url}?${queryString.stringify(accountLink)}`;
  console.log("LOGIN LINK", link);
  res.send(link);
  // 4. update payment schedule 
};

const updateDelayDays = async (accountId) => {
  const account = await stripe.account.update(accountId, {
    settings: {
      payouts: {
        schedule: {
          delay_days: 7,
        },
      },
    },
  });
  return account;
}

export const getAccountStatus = async (req, res) => {
  // console.log("GET ACOOUNT STATUS");
  const user = await User.findById(req.user._id).exec();
  const account = await stripe.accounts.retrieve(user.stripe_account_id);
  // console.log("USER ACCOUNT RETRIEVE", account);
  // update delay days
  const updateAccount = await updateDelayDays(account.id);
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {stripe_seller: updateAccount,},
    { new: true }
  )
    .select("-password")
    .exec();
  // console.log(updatedUser);
  res.json(updatedUser);
};

export const getAccountBalance = async (req, res) => {
  const user = await User.findById(req.user._id).exec();
  
  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    // console.log("BALANCE ===>", balance);
    res.json(balance);
} catch (err) {
    console.log(err);
  }
};

export const payoutSetting = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();

    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_account_id,
      {
        redirect_url: process.env.STRIPE_SETTING_REDIRECT_URL,
      }
    );
    // console.log("LOGIN LINK FOR PAYOUT SETTING", loginLink);
    res.json(loginLink);
  } catch (err) {
    console.log("STRIPE PAYOUT SETTING EERROR", err);
  }
};

export const StripeSessionId = async (req, res) => {
 // console.log("you hit stripe session id", req.body.hotelId);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    currency: 'usd',
    line_items: [
      {
        price: "1000",
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: 123,
      transfer_data: {
        destination: "acct_1LbfbYQidD1aNywL",
      },
    },
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
  });
  console.log("SESSION ===>", session);
};