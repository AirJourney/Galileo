"use strict";

const Controller = require("egg").Controller;
const uAPI = require("uapi-json");
const { diffTime } = require("../extend/utils");
const timeHelper = require("../extend/time");

const settings = {
  auth: {
    username: "Universal API/uAPI3014957689-64e92b4b",
    password: "Dw6&i4!Q_b",
    targetBranch: "P4407266",
  },
  // debug: 2,
  production: true,
};

class TestApiController extends Controller {
  async test() {
    const { ctx, app } = this;
    const { diffTime } = require("../extend/utils");
    console.log(timeHelper.getTime("2022-03-18T01:00:00.000+08:00", "M"));
    const { h, m } = diffTime(
      "2022-03-17T22:50:00.000+08:00",
      "2022-03-18T22:35:00.000+08:00"
    );
    console.log(h + "-" + m);
  }

  async testSeg() {
    const { ctx, app } = this;
    const seg = ctx.service.segment.cruiseTest();
    ctx.body = seg;
  }

  async currency() {
    const { ctx, app } = this;
    const { currencies } = ctx.request.body;
    const rate = await ctx.service.currency.convert(currencies);
    ctx.body = rate;
  }

  async segment() {
    const { ctx, app } = this;

    // const leg = [
    //   {
    //     from: "AKL",
    //     to: "CHC",
    //     departureDate: "2023-05-28",
    //   }
    // ];
    // leg.push(segmentReq);
    const {segments,IPCC} = ctx.request.body;
    const seg = await ctx.service.segment.cruiseGalileo(segments,IPCC);
    ctx.body = seg;
  }

  async addDay() {
    this.ctx.body = timeHelper.addDay();
  }

  async fare() {
    const { ctx } = this;
    const seg = await ctx.service.segment.fareRuleTest();
    ctx.body = seg;
  }

  async booking() {
    const { ctx } = this;
    const bookingRes = await ctx.service.booking.bookingTest();
    ctx.body = bookingRes;
  }

  async dbSearch() {
    const { ctx, app } = this;

    const keys = await app.redis.get("db0").keys("*HKDTYO*");

    // // 获取匹配的 key 对应的值
    // const values = await Promise.all(
    //   keys.map((key) => app.redis.get("db0").get(key))
    // );

    // // 将 key 和 value 组装成对象
    // const result = keys.reduce((obj, key, index) => {
    //   obj[key] = values[index];
    //   return obj;
    // }, {});

    ctx.body = keys;
  }
}

module.exports = TestApiController;
