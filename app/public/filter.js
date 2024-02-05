const timeHelper = require("../extend/time");

const filterFares = (fare) => {
  const transforStandardMinTime = 1.5;
  const transforStandardMaxTime = 4;
  let directBreak = false;

  if (fare && fare.directions && fare.directions.length > 0) {
    fare.directions.forEach((flight, fi) => {
      if (directBreak) {
        return;
      }
      const flightFliter = [];
      flight.forEach((d) => {
        if (
          directBreak ||
          !d.segments ||
          d.segments.length == 0 ||
          d.segments.length > 2 // 移除中转情况，中转为 2
        ) {
          directBreak = true;
          return;
        }

        if (d.segments.length == 1) {
        } else if (d.segments.length == 2) {
          if (
            d.segments[0].baggage[0].amount != d.segments[1].baggage[0].amount
          ) {
            directBreak = true;
            return;
          }

          const transforTime = transforHour(d.segments[0], d.segments[1]);
          if (
            transforTime >= transforStandardMinTime &&
            transforTime <= transforStandardMaxTime
          ) {
            flightFliter.push(d);
          } else {
            directBreak = true;
          }
        }
      });

      if (flightFliter.length > 0) {
        fare.directions[fi] = flightFliter;
      }
    });
  }
  return !directBreak;
};

const transforHour = (prevSegment, nextSegment) => {
  let transHour = 0;
  const arrivalTime = prevSegment.arrival;
  const departureTime = nextSegment.departure;
  const diffTime = timeHelper.diffTime(arrivalTime, departureTime);
  transHour = Number(diffTime.h);
  return transHour;
};

const hitSchema = (schemaList, flightType, carriers, cabins, flightNos) => {
  let hitCarrierSchema = null;

  if (flightType == "OW") {
    const carrier = carriers && carriers.length > 0 ? carriers[0] : "";
    const cabin = cabins && cabins.length > 0 ? cabins[0] : "";
    const flightNo = flightNos && flightNos.length > 0 ? flightNos[0] : "";

    schemaList.forEach((schema) => {
      const segmentSchema = schema.split("|")[0];
      const sCarrier = segmentSchema.split("-")[2];
      const sFlightNo = segmentSchema.split("-")[3];
      const sCabin = segmentSchema.split("-")[4].split("&")[0];

      if (sCarrier == carrier && sFlightNo == flightNo && sCabin == cabin) {
        hitCarrierSchema = schema;
        return;
      }
    });
  } else {
    const fwtCarrier = carriers && carriers.length > 0 ? carriers[0] : "";
    const fwtCabin = cabins && cabins.length > 0 ? cabins[0] : "";
    const fwtFlightNo = flightNos && flightNos.length > 0 ? flightNos[0] : "";

    const bwtCarrier = carriers && carriers.length > 1 ? carriers[1] : "";
    const bwtCabin = cabins && cabins.length > 1 ? cabins[1] : "";
    const bwtFlightNo = flightNos && flightNos.length > 1 ? flightNos[1] : "";

    schemaList.forEach((schema) => {
      const fwtSchema = schema.split("@")[0];
      const fwtSegmentSchema = fwtSchema.split("|")[0];
      const sFWTCarrier = fwtSegmentSchema.split("-")[2];
      const sFWTFlightNo = fwtSegmentSchema.split("-")[3];
      const sFWTCabin = fwtSegmentSchema.split("-")[4].split("&")[0];

      const bwtSchema = schema.split("@")[1];
      const bwtSegmentSchema = bwtSchema.split("|")[0];
      const sBWTCarrier = bwtSegmentSchema.split("-")[2];
      const sBWTFlightNo = bwtSegmentSchema.split("-")[3];
      const sBWTCabin = bwtSegmentSchema.split("-")[4].split("&")[0];

      if (
        sFWTCarrier == fwtCarrier &&
        sFWTFlightNo == fwtFlightNo &&
        sFWTCabin == fwtCabin &&
        sBWTCarrier == bwtCarrier &&
        sBWTFlightNo == bwtFlightNo &&
        sBWTCabin == bwtCabin
      ) {
        hitCarrierSchema = schema;
        return;
      }
    });
  }

  return hitCarrierSchema;
};

module.exports = { filterFares, hitSchema };

//"0015(+8)-1215-MU-553-E&B-PVG-T1-CDG-T2E-1-77W-BS50AENA-0630(+2)-P3570601/0330*1000(+2)-0130-AF-1580-E&B-CDG-T2E-LHR-T4-1-223-BS50AENA-1030(+1)-P3570601|3409.00-441.71-2658.00-430.23-2658.00-413.20
//@
//1630(+1)-0225-BA-464-E&N-LHR-T5-MAD-T4S-1-32N-LK50AALA-1955(+2)-P3570601/0330*2325(+2)-1250-MU-710-E&L-MAD-T1-PVG-T1-1-359-LK50AALA-1815(+8)-P3570601|3409.00-441.71-2658.00-430.23-2658.00-413.20"
// [
//   "1140(+9)-0320-JL-85-E&O-HND-T3-PVG-T1-2-767-ONN0OUCI-1400(+8)-P3570601|126.00-73.38-95.00-64.01-95.00-57.67",
//   "1350(+9)-0325-MU-524-E&Z-NRT-T2-PVG-T1-2-77W-ZSP0WCS5-1615(+8)-P3570601|133.00-73.51-100.00-65.78-100.00-59.44",
//   "1055(+9)-0335-MU-272-E&Z-NRT-T2-PVG-T1-2-321-ZSP0WCS5-1330(+8)-P3570601|133.00-73.51-100.00-65.78-100.00-59.44",
//   "1250(+9)-0330-CZ-8310-E&V-NRT-T1-PVG-T2-2-330-V2LSRSJP-1520(+8)-P3570601|133.00-73.51-100.00-65.78-100.00-59.44",
//   "0920(+9)-0305-JL-81-E&O-HND-T3-SHA-T1-2-767-ONN0OUCI-1125(+8)-P3570601|139.00-73.38-105.00-64.01-105.00-57.67",
//   "0005(+9)-0250-HO-1386-E&L-HND-T3-PVG-T2-2-32A-LOWD-0155(+8)-P3570601|135.00-73.76-135.00-64.39-135.00-58.05",
//   "1325(+9)-0320-HO-1380-E&L-NRT-T2-PVG-T2-2-789-LOWD-1545(+8)-P3570601|135.00-73.51-135.00-65.78-135.00-59.44",
//   "1300(+9)-0355-MU-728-E&T-NRT-T2-PVG-T1-2-320-TBE0WCS5-1555(+8)-P3570601|247.00-73.51-186.00-65.78-186.00-59.44",
//   "1530(+9)-0400-MU-522-E&T-NRT-T2-PVG-T1-2-359-TBE0WCS5-1830(+8)-P3570601|247.00-73.51-186.00-65.78-186.00-59.44",
//   "1350(+9)-0325-MU-524-E&T-NRT-T2-PVG-T1-2-77W-TBE0WDF5-1615(+8)-P3570601|260.00-73.51-196.00-65.78-196.00-59.44",
//   "1055(+9)-0335-MU-272-E&T-NRT-T2-PVG-T1-2-321-TBE0WDF5-1330(+8)-P3570601|260.00-73.51-196.00-65.78-196.00-59.44",
//   "1300(+9)-0355-MU-728-E&T-NRT-T2-PVG-T1-2-320-TBE0WDF5-1555(+8)-P3570601|260.00-73.51-196.00-65.78-196.00-59.44",
//   "1530(+9)-0400-MU-522-E&T-NRT-T2-PVG-T1-2-359-TBE0WDF5-1830(+8)-P3570601|260.00-73.51-196.00-65.78-196.00-59.44",
//   "0840(+9)-0250-MU-576-E&V-HND-T3-PVG-T1-2-332-VBE0WCS5-1030(+8)-P3570601|285.00-73.76-215.00-64.39-215.00-58.05",
//   "1430(+9)-0350-MU-538-E&V-HND-T3-SHA-T1-2-333-VBE0WCS5-1720(+8)-P3570601|285.00-73.76-215.00-64.39-215.00-58.05",
//   "0840(+9)-0250-MU-576-E&V-HND-T3-PVG-T1-2-332-VBE0WDF5-1030(+8)-P3570601|298.00-73.76-224.00-64.39-224.00-58.05",
//   "1430(+9)-0350-MU-538-E&V-HND-T3-SHA-T1-2-333-VBE0WDF5-1720(+8)-P3570601|298.00-73.76-224.00-64.39-224.00-58.05",
//   "1045(+9)-0355-CZ-648-E&L-HND-T3-PKX-T0-2-330-L2LSRSJP-1340(+8)-P3570601/0220*1600(+8)-0220-CZ-8885-E&L-PKX-T0-SHA-T2-2-330-L2LSRSJP-1820(+8)-P3570601|308.00-94.17-231.00-78.42-231.00-72.08",
//   "0200(+9)-0235-KE-720-E&M-HND-T3-ICN-T2-1-739-MNE00RJC-0435(+9)-P3570601/0355*0830(+9)-0210-KE-893-E&M-ICN-T2-PVG-T1-1-332-MNE00RJC-0940(+8)-P3570601|419.00-85.02-314.00-75.65-314.00-69.31",
//   "1140(+9)-0320-JL-85-B&I-HND-T3-PVG-T1-3-767-INN0OUCI-1400(+8)-P3570601|475.00-73.38-356.00-64.01-356.00-57.67",
//   "0920(+9)-0305-JL-81-B&I-HND-T3-SHA-T1-3-767-INN0OUCI-1125(+8)-P3570601|507.00-73.38-381.00-64.01-381.00-57.67",
//   "0200(+9)-0235-KE-720-E&Y-HND-T3-ICN-T2-1-739-YOWKE-0435(+9)-P3570601/0355*0830(+9)-0210-KE-893-E&Y-ICN-T2-PVG-T1-1-332-YOWKE-0940(+8)-P3570601|571.00-85.02-428.00-75.65-428.00-69.31",
//   "1140(+9)-0320-MU-4423-E&H-HND-T3-PVG-T1-2-767-HSJ0WDN5-1400(+8)-P3570601|965.00-73.76-724.00-64.39-724.00-58.05",
//   "2230(+9)-0305-NH-967-E&Y-HND-T3-PVG-T2-2-788-Y2XOWA1-0035(+8)-P3570601|1337.00-73.12-1003.00-63.75-1003.00-57.41",
//   "0920(+9)-0320-NH-919-E&Y-NRT-T1-PVG-T2-2-763-Y2XOWA1-1140(+8)-P3570601|1337.00-73.51-1003.00-65.78-1003.00-59.44",
//   "1725(+9)-0320-JL-89-E&Y-HND-T3-PVG-T1-2-789-YNX0OABA-1945(+8)-P3570601|1391.00-73.38-1044.00-64.01-1044.00-57.67",
//   "1005(+9)-0310-NH-969-E&Y-HND-T2-SHA-T1-2-788-Y2XOWA1-1215(+8)-P3570601|1400.00-73.12-1051.00-63.75-1051.00-57.41",
//   "1725(+9)-0320-JL-89-B&J-HND-T3-PVG-T1-3-789-JNX0OABA-1945(+8)-P3570601|2075.00-73.38-1557.00-64.01-1557.00-57.67",
//   "2230(+9)-0305-NH-967-B&J-HND-T3-PVG-T2-2-788-J2XOWA1-0035(+8)-P3570601|2085.00-73.12-1564.00-63.75-1564.00-57.41",
//   "0920(+9)-0320-NH-919-B&J-NRT-T1-PVG-T2-2-763-J2XOWA1-1140(+8)-P3570601|2085.00-73.51-1564.00-65.78-1564.00-59.44",
//   "1005(+9)-0310-NH-969-B&J-HND-T2-SHA-T1-2-788-J2XOWA1-1215(+8)-P3570601|2148.00-73.12-1611.00-63.75-1611.00-57.41"
// ]
