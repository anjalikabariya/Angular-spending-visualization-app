const router = require("express").Router();

const Transaction = require("../db/models/transaction");
const Conversion = require("../db/models/conversion");
const { DAILY, resolveDateRange } = require("../utils/helpers");

const methodNotAllowed = (req, res, next) => {
  return res.header("Allow", "GET").sendStatus(405);
};

const getSpending = async (req, res, next) => {
  const { query } = req;
  const range = query.range ? parseInt(query.range, 10) : 6;
  const frame = query.frame || DAILY;
  let fromCurrency = "USD";
  const toCurrency = query.currency || "CAD"; // Default currency is CAD
  
  // Fetch conversion rate from the Conversion model
  /*
  * Run `npm run seed` to refresh your database with transactions closer to-date
  */
 const { from, to } = resolveDateRange(frame, range);
 const transactions = await Transaction.getTransactionsForRange(from, to);

 const exchangeRate = await Conversion.findExchangeRate(fromCurrency, toCurrency);
 fromCurrency = toCurrency;
 const totalAmountMap = {};
 
 for (const transaction of transactions) {
   // Convert transaction amount to the requested currency
    const convertedAmount = exchangeRate ? transaction.amount * exchangeRate.dataValues.rate : transaction.amount;
    /*
     * Groups transactions per day
     */
    const date = new Date(transaction.date);
    const dateString = date.toLocaleDateString("en-US");

    if (dateString in totalAmountMap) {
      // totalAmountMap[dateString] = totalAmountMap[dateString
      totalAmountMap[dateString] += convertedAmount;
    } else {
      totalAmountMap[dateString] = convertedAmount;
    }
  }

  const formattedSpendingData = [];

  Object.keys(totalAmountMap).forEach((date) => {
    formattedSpendingData.push({
      totalAmount: +totalAmountMap[date].toFixed(2),
      startDate: new Date(date).toISOString(),
    });
  });

  const data = {
    spendings: formattedSpendingData.sort(function (a, b) {
      return new Date(a.startDate) - new Date(b.startDate);
    }),
  };

  return res.json(data);
};

router.route("/").get(getSpending).all(methodNotAllowed);

module.exports = router;
