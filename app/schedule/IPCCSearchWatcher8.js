const Subscription = require("egg").Subscription;
const timeHelper = require("../extend/time");
const IPCCList = require("../data/IPCC.json");

class IPCCSearchWatcher extends Subscription {
  static get schedule() {
    return {
      cron: "0 0 */12 * * *",
      type: "worker",
      disable: false,
      immediate: true,
    };
  }
  async subscribe() {
    const { ctx, app } = this;

    ctx.logger.info(`IPCCSearchWatcher started at ${new Date()}`);

    const ipccSegmentReq = [];
    for (let IPCC of IPCCList) {
      ipccSegmentReq.push({ IPCC, group: "LLTrip" });
    }

    const result = await ctx.curl(
      "http://139.196.180.135:9001/support/getsegmentlist",
      // "http://127.0.0.1:9001/support/getsegmentlist",
      {
        method: "POST",
        contentType: "json",
        dataType: "json",
        headers: {},
        data: { IPCCList: ipccSegmentReq },
        timeout: 50000, // 设置超时时间为 5 秒
      }
    );

    let ipccSegmentList = [];
    if (
      result &&
      result.status == 200 &&
      result.data &&
      result.data.content &&
      result.data.content.length > 0
    ) {

      const chunkSize = Math.ceil(result.data.content.length/9);

      const serviceIndex = 8;

      const startIndex = 0+(serviceIndex-1)*chunkSize;
      const endIndex = chunkSize+(serviceIndex-1)*chunkSize-1;

     

     for(let i =startIndex;i<endIndex;i++){
      ipccSegmentList.push(result.data.content[i]);
     } 
       
     
    } else {
      ctx.logger.info("IPCCSearchWatcher Error", {
        result,
      });
      return;
    }

    const callSegmentRT = async function (i, y, pccSeg) {
      const forwardDay = timeHelper.addDay(i + 1);
      const backwardDay = timeHelper.addDay(y + 1);
      const forwardReq = {
        from: pccSeg.depart,
        to: pccSeg.arrival,
        departureDate: forwardDay,
      };
      const backwardReq = {
        from: pccSeg.arrival,
        to: pccSeg.depart,
        departureDate: backwardDay,
      };
      const leg = [];
      leg.push(forwardReq);
      leg.push(backwardReq);
      ctx.logger.info(`cruise result: RT ${pccSeg.depart}-${pccSeg.arrival} ${forwardDay}-${backwardDay} request`)

      const airlineLength = await ctx.service.segment.cruiseGalileo(leg, pccSeg.IPCC);
      ctx.logger.info(`cruise result: RT ${pccSeg.depart}-${pccSeg.arrival} ${forwardDay}-${backwardDay} ${airlineLength}`)
    };

    const callSegmentOW = async function (i, pccSeg) {
      const forwardDay = timeHelper.addDay(i + 1);
      const forwardReq = {
        from: pccSeg.depart,
        to: pccSeg.arrival,
        departureDate: forwardDay,
      };

      const leg = [];
      leg.push(forwardReq);
      ctx.logger.info(`cruise result: OW ${pccSeg.depart}-${pccSeg.arrival} ${forwardDay} request`)

      const airlineLength = await ctx.service.segment.cruiseGalileo(leg, pccSeg.IPCC);
      ctx.logger.info(`cruise result: OW ${pccSeg.depart}-${pccSeg.arrival} ${forwardDay} ${airlineLength}`)


    };

    const forDate = async function (pccSeg) {
      if (pccSeg.tripType == "RT") {
        for (let i = pccSeg.startDays; i < pccSeg.endDays; i++) {
          for (let y = i; y < pccSeg.endDays; y++) {
            await callSegmentRT(i, y, pccSeg);
          }
        }
      } else if (pccSeg.tripType == "OW") {
        for (let i = pccSeg.startDays; i < pccSeg.endDays; i++) {
          await callSegmentOW(i, pccSeg);
        }
      } else {
        for (let i = pccSeg.startDays; i < pccSeg.endDays; i++) {
          for (let y = i; y < pccSeg.endDays; y++) {
            await callSegmentRT(i, y, pccSeg);
          }
        }

        for (let i = pccSeg.startDays; i < pccSeg.endDays; i++) {
          await callSegmentOW(i, pccSeg);
        }
      }
    };

    for (let [pccSegIndex, pccSeg] of ipccSegmentList.entries()) {
      await forDate(pccSeg);
      // 判断是否到循环结尾
      if (pccSegIndex === ipccSegmentList.length - 1) {
        ctx.logger.info(`SearchWatcher stopped at ${new Date()}`);
      }
    }
  }
}

module.exports = IPCCSearchWatcher;
