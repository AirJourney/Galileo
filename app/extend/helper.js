const uuid = require("uuid");

module.exports = {
  GUID() {
    guid = uuid.v4().replace(/-/g, "");
    return guid;
  },
  ResFormat(ctx, sessionid, status, msg, content) {
    /*
     * sessionid: 会话串联id
     * status：bool 接口返回成功/失败（true/false）
     * msg: string 接口返回的信息，用作显示
     * content: 成功时返回接口内容/失败时显示error信息  this.ctx.request.originalUrl
     */
    let responseFormat = { sessionid, status, msg, content };
    const apiName = ctx.request.originalUrl;
    const reqBody = ctx.request.body;
    ctx.logger.info("api-record", {
      sessionid,
      apiName,
      reqBody,
      status,
      msg,
    });

    if (status == false) {
      ctx.status = 500;
    }

    ctx.status = 200;
    ctx.body = responseFormat;
  },
};
