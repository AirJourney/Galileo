"use strict";

const Service = require("egg").Service;
const uAPI = require("uapi-json");
const { apiSettings } = require("../public/setting");
const { currencySchema } = require("../public/currency");

class CurrencyService extends Service {
  async convert(currencies) {
    const { ctx, app } = this;
    const UtilsService = uAPI.createUtilsService(apiSettings);
    const dbName = "db2";

    const params = {
      currencies,
    };

    await UtilsService.currencyConvert(params).then(
      async (res) => {
        // console.log(res);
        const currencySchemaList = currencySchema(res);
        if (currencySchemaList && currencySchemaList.length > 0) {
          for (let i = 0; i < currencySchemaList.length; i++) {
            const currencySchema = currencySchemaList[i];

            await app.redis.get(dbName).del(currencySchema.key);
            await app.redis
              .get(dbName)
              .sadd(currencySchema.key, currencySchema.val);
          }
        }
      },
      (err) => console.log(err)
    );
  }
}

module.exports = CurrencyService;
