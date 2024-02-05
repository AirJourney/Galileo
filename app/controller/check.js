"use strict";

const Controller = require("egg").Controller;
const { hitSchema } = require("../public/filter");

class CheckApiController extends Controller {
  /**
   *
   * leg: [
      {
          "from": "TYO",
          "to": "SHA",
          "departureDate": "2023-09-15"
      }
    ]
   * IPCC: "P3570601"
   * carriers: ["MU","CA"]
   * cabins: ["Economy","Business"]
   * subCabin: "Y"
   * flightNo: "512"
   * 
   */
  async check() {
    const { ctx, app } = this;
    const { leg,IPCC } = ctx.request.body;
    const seg = await ctx.service.segment.cruiseGalileo(leg,IPCC);
    ctx.status = 200;
    ctx.body = seg;
  }

  /**
   *
   * leg: [
      {
          "from": "TYO",
          "to": "SHA",
          "departureDate": "2023-09-15"
      }
    ]
   * IPCC: "P3570601"
   * carriers: ["CA"]
   * cabins: ["E"]
   * flightNos: ["512"]
   * 
   */
  async checkflight() {
    const { ctx, app } = this;

    const { leg, IPCC, carriers, cabins, flightNos } = ctx.request.body;

    let res = null;
    const callback = (data) => {
      res = data;
    };
    await ctx.service.segment.cruiseGalileo2(leg, IPCC, callback);

    let flightType = leg.length>1?"RT":"OW"

    const hitCarrierSchema = hitSchema(res, flightType,carriers, cabins, flightNos);
    ctx.status = 200;
    if (hitCarrierSchema) {
      ctx.body = { hitCarrierSchema, status: 0 };
    } else {
      ctx.body = { hitCarrierSchema: "", status: -1 };
    }
  }
}

module.exports = CheckApiController;
