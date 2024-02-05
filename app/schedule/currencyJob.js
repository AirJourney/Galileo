const Subscription = require("egg").Subscription;


class CurrencyWatcher extends Subscription {
  static get schedule() {
    return {
      interval: "2m",
      type: "worker",
      disable: true,
      immediate: true,
    };
  }
  
  async subscribe() {
    const { ctx, app } = this;

    const currencies = require('../../kitchen/currency.json');
    await ctx.service.currency.convert(currencies);
  }
}

module.exports = CurrencyWatcher;
