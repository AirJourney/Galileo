"use strict";

const Controller = require("egg").Controller;

class SwitchController extends Controller {
  async index() {
    const { ctx, app } = this;
    await app.redis.get("db1").set("jobSwitch", "True"); //打开db1链接，设置 key 为1 的值为db1 hellow1
    let getRes = await app.redis.get("db1").get("jobSwitch");
    ctx.body = getRes;
  }

  async jobSwitch() {
    const { ctx, app } = this;
    let jobStatus = await app.redis.get("db1").get("jobSwitch");
    jobStatus = !(jobStatus=='true');
    await app.redis.get("db1").set("jobSwitch", jobStatus.toString());
    ctx.body = await app.redis.get("db1").get("jobSwitch");
  }
}

module.exports = SwitchController;
