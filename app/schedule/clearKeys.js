const Subscription = require("egg").Subscription;
const timeHelper = require("../extend/time");

class ExpiredWatcher extends Subscription {
  static get schedule() {
    return {
      cron: '0 0 */24 * * *',
      type: "worker",
      disable: true,
      immediate: false,
    };
  }
  async subscribe() {
    const { ctx, app } = this;
    let delCount = 0;
    await app.redis.get("db0").keys("*", (err, keyList) => {
      keyList.forEach(async (key) => {
        if (timeHelper.compareDate(key.substr(0, 4))) {
          await app.redis.get("db0").del(key);
          delCount++;
        }
      });
    });

    await app.redis.get("db1").keys("*", (err, keyList) => {
      keyList.forEach(async (key) => {
        if (key != "jobSwitch" && timeHelper.compareDate(key.substr(0, 4))) {
          await app.redis.get("db1").del(key);
          delCount++;
        }
      });
    });
  }
}

module.exports = ExpiredWatcher;
