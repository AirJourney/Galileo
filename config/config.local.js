/* eslint valid-jsdoc: "off" */

"use strict";

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = (appInfo) => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_0805";

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    myAppName: "LLTrip-Cruise",
  };

  config.cluster = {
    listen: {
      port: 9001,
      hostname: "127.0.0.1", // 不建议设置 hostname 为 '0.0.0.0'，它将允许来自外部网络和来源的连接，请在知晓风险的情况下使用
      // path: '/var/run/egg.sock',
    },
  };

  config.redis = {
    // 单个数据库用client
    // client: {
    //   port: 6379, // Redis port
    //   host: "r-j6c26r3xdt46dh47wrpd.redis.rds.aliyuncs.com", // Redis host
    //   password: "lltrip@2022",
    //   db: 0,
    // },

    // 使用多个数据库连接
    clients: {
      db0: {
        port: 6379, // Redis port
        host: "r-uf6r3mrlxpmik7gdsjpd.redis.rds.aliyuncs.com", // Redis host
        password: "lltrip@2022",
        db: 0,
      },
      db1: {
        port: 6379, // Redis port
        host: "r-uf6r3mrlxpmik7gdsjpd.redis.rds.aliyuncs.com", // Redis host
        password: "lltrip@2022",
        db: 1,
      },
      db2: {
        port: 6379, // Redis port
        host: "r-uf6r3mrlxpmik7gdsjpd.redis.rds.aliyuncs.com", // Redis host
        password: "lltrip@2022",
        db: 2,
      },
    },
  };

  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true,
    },
    domainWhiteList: ["http://127.0.0.1:3000"],
  };

  config.cors = {
    origin: "http://127.0.0.1:3000",
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH",
    credentials: true,
  };

  return {
    ...config,
    ...userConfig,
  };
};
