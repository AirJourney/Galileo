"use strict";

const Service = require("egg").Service;
const uAPI = require("uapi-json");
const { apiSettings } = require("../public/setting");
const {
  response2Schema,
  fareSchema,
  penaltySchema,
} = require("../public/translate");
const { filterFares } = require("../public/filter");

class SegmentService extends Service {
  async cruiseGalileo(payload, IPCC, carriers) {
    const { ctx, app } = this;

    if (IPCC) {
      apiSettings.auth.targetBranch = IPCC;
    }else{
      IPCC = "P3570601";
    }

    const AirService = uAPI.createAirService(apiSettings);

    const params = {
      legs: [],
      passengers: {
        ADT: 1,
        CNN: 1,
        INS: 1,
        /*
        CNN:1,
        INF: 1,
        INS: 1, //infant with a seat
        */
      },
      pricing: {
        currency: "EUR",
      },
      // carriers: ["NH", "AC"],
      // allowDirectAccess: true,
      faresOnly: false,
      // requestId: "1123222-18",
    };

    // 筛选航司
    if (carriers && carriers.length > 0) {
      params.carriers = carriers;
    }

    const flightType = payload.length > 1 ? "RT" : "OW";
    payload.forEach((p) => {
      params.legs.push(p);
    });

    let redisKey = "";

    const depDateSplit = payload[0].departureDate.split("-");

    redisKey =
      depDateSplit[1] + depDateSplit[2] + payload[0].from + payload[0].to;

    let avlDateSplit = "";
    if (flightType == "RT") {
      avlDateSplit = payload[1].departureDate.split("-");
      redisKey += avlDateSplit[1] + avlDateSplit[2];
    }

    // console.log(redisKey + ":" + redisCache);
    let dbName = "db0";
    if (flightType == "RT") {
      dbName = "db1";
    }

    let airlineLength = -1;

    await AirService.shop(params)
      .then(async (results) => {
        airlineLength = results.fares.length;

        if (results && results.fares && results.fares.length > 0) {
          var fareList = [];
          results.fares.forEach((fare) => {
            if (filterFares(fare)) {
              fareList.push(fare);
            }
          });

          if (fareList.length == 0) {
            return;
          }

          // 不用重置，按IPCC号进行删除再添加
          // await app.redis.get(dbName).del(redisKey);

          const fareSchemaList = [];

          fareList.forEach(async (fare, segId) => {
            if (
              fare &&
              fare.directions &&
              fare.directions.length > 0 &&
              fare.passengerFares
            ) {
              /*
               * directions第一个数组代表去/返程，去程为0，返程为1；第二个数组代表航线，有多个
               *
               * directions[
               *      去程 数组中的舱位/中转等信息不同，但价格一致[
               *            航司A {
               *                  航线（直飞/中转）
               *                  },
               *            航司A {
               *                  航线（直飞/中转）
               *                  }
               *          ],
               *      返程 数组中的舱位/中转等信息不同，但价格一致[
               *            航司A {
               *                  航线（直飞/中转）
               *                  },
               *            航司A {
               *                  航线（直飞/中转）
               *                  }
               *          ]
               * ]
               *
               * 去程数组中的多个结果由层级结构，变成平级结构的schema存入redis，即结果会变多
               *
               */

              let psgfareSchema = "";
              for (let di = 0; di < fare.directions[0].length; di++) {
                const d = fare.directions[0][di];
                let segmentSchema = response2Schema(d, IPCC);

                if (segmentSchema == "") {
                  break;
                }

                // 避免重复计算价格
                if (di == 0) {
                  psgfareSchema = fareSchema(fare.passengerFares);
                }

                if (segmentSchema != "") {
                  segmentSchema += "|" + psgfareSchema;
                }
                if (flightType == "RT") {
                  segmentSchema = `FWT${segId}#` + segmentSchema;
                }

                fareSchemaList.push(segmentSchema);
                // if (allowPenalty) {
                //   const farerules_params = {
                //     segments: d.segments,
                //     passengers: params.passengers,
                //   };
                //   await AirService.fareRules(farerules_params).then(
                //     async (res) => {
                //       const fareRuleSchema = penaltySchema(res);
                //       const redisSchema = segmentSchema + "|" + fareRuleSchema;
                //       await app.redis.get(dbName).sadd(redisKey, redisSchema);
                //     }
                //   );
                // } else {
                // await app.redis.get(dbName).sadd(redisKey, segmentSchema);
                // }
              }

              if (flightType == "RT") {
                for (let di = 0; di < fare.directions[1].length; di++) {
                  const d = fare.directions[1][di];

                  let segmentSchema = response2Schema(d, IPCC);
                  // console.log("RT" + segmentSchema);
                  if (segmentSchema == "") {
                    break;
                  }

                  if (di == 0) {
                    psgfareSchema = fareSchema(fare.passengerFares);
                  }

                  if (segmentSchema != "") {
                    segmentSchema += "|" + psgfareSchema;
                  }
                  segmentSchema = `BWT${segId}#` + segmentSchema;
                  fareSchemaList.push(segmentSchema);

                  // if (allowPenalty) {
                  //   const farerules_params = {
                  //     segments: d.segments,
                  //     passengers: params.passengers,
                  //   };
                  //   await AirService.fareRules(farerules_params).then(
                  //     async (res) => {
                  //       const fareRuleSchema = penaltySchema(res);
                  //       const redisSchema =
                  //         segmentSchema + "|" + fareRuleSchema;
                  //       await app.redis.get(dbName).sadd(redisKey, redisSchema);
                  //     }
                  //   );
                  // } else {
                  // await app.redis.get(dbName).sadd(redisKey, segmentSchema);
                  // }
                }
              }
            }
          });
          airlineLength = fareSchemaList.length;
          this.writeRedis(dbName, redisKey, fareSchemaList, IPCC);
        } else {
          ctx.logger.info("noResult", params.legs);
        }
      })
      .catch((err) => {
        ctx.logger.error("warning +++ noResult", `${JSON.stringify(params.legs)} and error:${err}`);
      });
    return airlineLength;
  }

  async writeRedis(dbName, redisKey, redisValueList, IPCC) {
    const { ctx, app } = this;

    // 获取集合中的所有成员
    const members = await app.redis.get(dbName).smembers(redisKey);

    // 遍历集合中的成员
    for (const member of members) {
      // 判断成员是否与要添加的内容匹配
      if (member.includes(IPCC)) {
        // 如果匹配，删除匹配到的成员
        await app.redis.get(dbName).srem(redisKey, member);
      }
    }

    for (const rVal of redisValueList) {
      await app.redis.get(dbName).sadd(redisKey, rVal);
    }
  }

  async cruiseGalileo2(payload, IPCC = "P3570601", callback) {
    const { ctx, app } = this;

    if (IPCC) {
      apiSettings.auth.targetBranch = IPCC;
    }

    const AirService = uAPI.createAirService(apiSettings);

    const params = {
      legs: [],
      passengers: {
        ADT: 1,
        CNN: 1,
        INS: 1,
        /*
        CNN:1,
        INF: 1,
        INS: 1, //infant with a seat
        */
      },
      pricing: {
        currency: "EUR",
      },
      // carriers: ["NH", "AC"],
      // allowDirectAccess: true,
      faresOnly: false,
      // requestId: "1123222-18",
    };

    // 筛选航司
    // if (carriers && carriers.length > 0) {
    //   params.preferredCarriers = carriers;
    // }

    // if (cabins && cabins.length > 0) {
    //   params.cabins = cabins;
    // }

    const flightType = payload.length > 1 ? "RT" : "OW";
    payload.forEach((p) => {
      params.legs.push(p);
    });

    let redisKey = "";

    const depDateSplit = payload[0].departureDate.split("-");

    redisKey =
      depDateSplit[1] + depDateSplit[2] + payload[0].from + payload[0].to;

    let avlDateSplit = "";
    if (flightType == "RT") {
      avlDateSplit = payload[1].departureDate.split("-");
      redisKey += avlDateSplit[1] + avlDateSplit[2];
    }

    // console.log(redisKey + ":" + redisCache);
    let dbName = "db0";
    if (flightType == "RT") {
      dbName = "db1";
    }

    let airlineLength = -1;

    await AirService.shop(params)
      .then(async (results) => {
        airlineLength = results.fares.length;

        if (results && results.fares && results.fares.length > 0) {
          var fareList = [];
          results.fares.forEach((fare) => {
            if (filterFares(fare)) {
              fareList.push(fare);
            }
          });

          if (fareList.length == 0) {
            return;
          }

          // 不用重置，按IPCC号进行删除再添加
          // await app.redis.get(dbName).del(redisKey);

          const fareSchemaList = [];

          fareList.forEach(async (fare, segId) => {
            if (
              fare &&
              fare.directions &&
              fare.directions.length > 0 &&
              fare.passengerFares
            ) {
              /*
               * directions第一个数组代表去/返程，去程为0，返程为1；第二个数组代表航线，有多个
               *
               * directions[
               *      去程 数组中的舱位/中转等信息不同，但价格一致[
               *            航司A {
               *                  航线（直飞/中转）
               *                  },
               *            航司A {
               *                  航线（直飞/中转）
               *                  }
               *          ],
               *      返程 数组中的舱位/中转等信息不同，但价格一致[
               *            航司A {
               *                  航线（直飞/中转）
               *                  },
               *            航司A {
               *                  航线（直飞/中转）
               *                  }
               *          ]
               * ]
               *
               * 去程数组中的多个结果由层级结构，变成平级结构的schema存入redis，即结果会变多
               *
               */

              let psgfareSchema = "";
              for (let di = 0; di < fare.directions[0].length; di++) {
                const d = fare.directions[0][di];
                let segmentSchema = response2Schema(d, IPCC);

                if (segmentSchema == "") {
                  break;
                }

                // 避免重复计算价格
                if (di == 0) {
                  psgfareSchema = fareSchema(fare.passengerFares);
                }

                if (segmentSchema != "") {
                  segmentSchema += "|" + psgfareSchema;
                }
                if (flightType == "RT") {
                  segmentSchema = `FWT${segId}#` + segmentSchema;
                }

                fareSchemaList.push(segmentSchema);
              }

              if (flightType == "RT") {
                for (let di = 0; di < fare.directions[1].length; di++) {
                  const d = fare.directions[1][di];

                  let segmentSchema = response2Schema(d, IPCC);
                  // console.log("RT" + segmentSchema);
                  if (segmentSchema == "") {
                    break;
                  }

                  if (di == 0) {
                    psgfareSchema = fareSchema(fare.passengerFares);
                  }

                  if (segmentSchema != "") {
                    segmentSchema += "|" + psgfareSchema;
                  }
                  segmentSchema = `BWT${segId}#` + segmentSchema;
                  fareSchemaList.push(segmentSchema);
                }
              }
            }
          });
          airlineLength = fareSchemaList.length;
          callback(fareSchemaList);
          this.writeRedis(dbName, redisKey, fareSchemaList, IPCC);
        } else {
          ctx.logger.info("noResult", params.legs);
        }
      })
      .catch((err) => {
        ctx.logger.info("warning +++ noResult", params.legs);
      });
  }

  async fareRule(segments, passengers) {
    const penaltySchemaStr = "";
    const farerules_params = {
      segments,
      passengers,
    };
    const AirService = uAPI.createAirService(apiSettings);
    await AirService.fareRules(farerules_params).then((res) => {
      penaltySchemaStr = penaltySchema(res);
    });
    return penaltySchemaStr;
  }

  async cruiseTest(payload) {
    const { ctx, app } = this;
    const AirService = uAPI.createAirService(apiSettings);

    const params = {
      legs: [],
      passengers: {
        ADT: 1,
        CNN: 1,
        INS: 1,
        /*
        CNN:1,
        INF: 1,
        INS: 1, //infant with a seat
        */
      },
      pricing: {
        currency: "EUR",
      },
      // carriers: ["NH", "AC"],
      // allowDirectAccess: true,
      faresOnly: false,
      // requestId: "1123222-18",
    };

    payload.forEach((p) => {
      params.legs.push(p);
    });

    await AirService.shop(params)
      .then(async (results) => {
        const forwardSegments = results.fares[0].directions[0][0].segments;
        const backSegments = results.fares[0].directions[1][0].segments;

        const farerules_params = {
          segments: forwardSegments.concat(backSegments),
          passengers: params.passengers,
          // long: true,
          // requestId: 'test',
        };

        await AirService.fareRules(farerules_params)
          .then(
            (res) => {
              //console.log(JSON.stringify(res));
              if (
                res &&
                res["air:AirPriceResult"] &&
                res["air:AirPriceResult"]["air:AirPricingSolution"] &&
                res["air:AirPriceResult"]["air:FareRule"]
              ) {
                /** 数据源，默认为第0个（待确认） */
                const solution =
                  res["air:AirPriceResult"]["air:AirPricingSolution"][
                    Object.keys(
                      res["air:AirPriceResult"]["air:AirPricingSolution"]
                    )[0]
                  ];

                /** 航段编号 */
                const segmentRefList =
                  solution["air:AirSegmentRef"] &&
                  solution["air:AirSegmentRef"].length > 0
                    ? solution["air:AirSegmentRef"]
                    : [];

                if (segmentRefList.length == 0) {
                  ctx.logger.info("segmentRefList Error", params.legs);
                  return;
                }

                /** 关联关系集合（成人、儿童、婴儿） */
                const priceInfo = solution["air:AirPricingInfo"]
                  ? solution["air:AirPricingInfo"]
                  : null;

                if (priceInfo == null) {
                  ctx.logger.info("priceInfo Error", params.legs);
                  return;
                }
                const segForwardRef = segmentRefList[0];
                const segBackwardRef =
                  segmentRefList.length > 1 ? segmentRefList[1] : undefined;

                const fareRuleList = [];

                Object.keys(priceInfo).forEach((priceKey) => {
                  const priceKeyInfo = priceInfo[priceKey];
                  let psyType = priceKeyInfo["air:PassengerType"][0];
                  if (psyType instanceof Object) {
                    psyType = psyType.Code;
                  }
                  const forwardFareInfoRef =
                    priceKeyInfo["air:BookingInfo"].filter(
                      (b) => b.SegmentRef == segForwardRef
                    ).length > 0
                      ? priceKeyInfo["air:BookingInfo"].filter(
                          (b) => b.SegmentRef == segForwardRef
                        )[0].FareInfoRef
                      : "";
                  const backwardFareInfoRef = segBackwardRef
                    ? priceKeyInfo["air:BookingInfo"].filter(
                        (b) => b.SegmentRef == segBackwardRef
                      ).length > 0
                      ? priceKeyInfo["air:BookingInfo"].filter(
                          (b) => b.SegmentRef == segBackwardRef
                        )[0].FareInfoRef
                      : ""
                    : "";
                  fareRuleList.push({
                    psyType,
                    forwardFareInfoRef,
                    backwardFareInfoRef,
                  });
                });

                const fareRules = res["air:AirPriceResult"]["air:FareRule"];

                fareRuleList.forEach((psgFareRef) => {
                  const fRefInfo =
                    fareRules.filter(
                      (f) => f.FareInfoRef == psgFareRef.forwardFareInfoRef
                    ).length > 0
                      ? fareRules.filter(
                          (f) => f.FareInfoRef == psgFareRef.forwardFareInfoRef
                        )[0]
                      : null;
                  if (!fRefInfo) return;
                  const fFareRuleInfo =
                    fRefInfo["air:FareRuleShort"].filter(
                      (f) => f.Category == "16"
                    ).length > 0
                      ? fRefInfo["air:FareRuleShort"].filter(
                          (f) => f.Category == "16"
                        )[0]
                      : null;
                  if (!fFareRuleInfo) return;
                  psgFareRef.forwardFareRule =
                    fFareRuleInfo["air:FareRuleNameValue"] &&
                    fFareRuleInfo["air:FareRuleNameValue"].Value
                      ? fFareRuleInfo["air:FareRuleNameValue"].Value
                      : "";

                  const refInfo =
                    fareRules.filter(
                      (f) => f.FareInfoRef == psgFareRef.backwardFareInfoRef
                    ).length > 0
                      ? fareRules.filter(
                          (f) => f.FareInfoRef == psgFareRef.backwardFareInfoRef
                        )[0]
                      : null;
                  if (!refInfo) return;
                  const fareRuleInfo =
                    refInfo["air:FareRuleShort"].filter(
                      (f) => f.Category == "16"
                    ).length > 0
                      ? refInfo["air:FareRuleShort"].filter(
                          (f) => f.Category == "16"
                        )[0]
                      : null;
                  if (!fareRuleInfo) return;
                  psgFareRef.backwardFareRule =
                    fareRuleInfo["air:FareRuleNameValue"] &&
                    fareRuleInfo["air:FareRuleNameValue"].Value
                      ? fareRuleInfo["air:FareRuleNameValue"].Value
                      : "";
                });
                // console.log(fareRuleList);
              } else {
                ctx.logger.info("fareInfo Error", params.legs);
              }
            },
            (err) => {
              console.error("rule error", err);
            }
          )
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        // console.log("err", err);
      });
  }
}

module.exports = SegmentService;
