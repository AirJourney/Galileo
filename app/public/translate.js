'use strict';
const timeHelper = require('../extend/time');

const segmentSchema = segment => {
  let segSchema = '';

  const segDetail =
    segment.details && segment.details.length > 0 ? segment.details[0] : null;
  if (segDetail == null) {
    return segSchema;
  }

  const DepartureTimeSchema =
    timeHelper.getTime(segment.departure, 'H') +
    timeHelper.getTime(segment.departure, 'M')
  + '(' + timeHelper.getTime(segment.departure, 'Z') + ')';
  const ArrivalTimeSchema =
    timeHelper.getTime(segment.arrival, 'H') +
    timeHelper.getTime(segment.arrival, 'M')
  + '(' + timeHelper.getTime(segment.arrival, 'Z') + ')';
  const diffTime = timeHelper.diffTime(segment.departure, segment.arrival);
  const DepartureOffet = diffTime.h + diffTime.m;
  const AirlineCodeSchema = segment.airline;
  const FlightNumberSchema = segment.flightNumber;
  const AirlineClass =
    (segment.serviceClass === 'Economy' || segment.serviceClass === 'PremiumEconomy' ? 'E' : 'B') +
    '&' +
    segment.bookingClass;

  const DeparturePort = segDetail.origin;
  const DepartureStation = segDetail.originTerminal
    ? 'T' + segDetail.originTerminal
    : 'T0'; // 独立航站楼为TO
  const ArrivalPort = segDetail.destination;
  const ArrivalStation = segDetail.destinationTerminal
    ? 'T' + segDetail.destinationTerminal
    : 'T0'; // 独立航站楼为TO

  let baggageSchema = '';
  if (segment.baggage && segment.baggage.length > 0) {
    if (segment.baggage[0].units === 'kilograms') {
      baggageSchema = '-' + segment.baggage[0].amount + 'kg';
    } else {
      baggageSchema = '-' + segment.baggage[0].amount;
    }
  }

  let planeSchema = '';
  if (segment.plane && segment.plane.length > 0) {
    planeSchema = '-' + segment.plane[0];
  }

  const fareBasisCode = segment.fareBasisCode;

  segSchema =
    DepartureTimeSchema +
    '-' +
    DepartureOffet +
    '-' +
    AirlineCodeSchema +
    '-' +
    FlightNumberSchema +
    '-' +
    AirlineClass +
    '-' +
    DeparturePort +
    '-' +
    DepartureStation +
    '-' +
    ArrivalPort +
    '-' +
    ArrivalStation +
    baggageSchema +
    planeSchema +
    '-' +
    fareBasisCode +
    '-' +
    ArrivalTimeSchema;

  return segSchema;
};

const transforSchema = (prevSegment, nextSegment) => {
  let transSchema = '';
  const arrivalTime = prevSegment.arrival;
  const departureTime = nextSegment.departure;
  const diffTime = timeHelper.diffTime(arrivalTime, departureTime);
  transSchema = diffTime.h + diffTime.m;
  return transSchema;
};

const response2Schema = (direction, IPCC) => {
  let schema = '';
  const segmentList =
    direction && direction.segments && direction.segments.length > 0
      ? direction.segments
      : [];

  for (let si = 0; si < segmentList.length; si++) {
    const seg = segmentList[si];
    const segSchema = segmentSchema(seg);
    if (segSchema !== '') {
      schema += segSchema;
      schema += '-' + IPCC;
    } else {
      break;
    }

    if (si + 1 < segmentList.length) {
      const nextSeg = segmentList[si + 1];
      const tfSchema = transforSchema(seg, nextSeg);
      if (tfSchema !== '') {
        schema += '/' + tfSchema + '*';
      } else {
        break;
      }
    }
  }

  return schema;
};

const psgFareSchema = psgFare => {
  let psgFareSchema = '';
  if (
    psgFare &&
    (psgFare.basePrice || psgFare.equivalentBasePrice) &&
    psgFare.taxes
  ) {
    if (psgFare.equivalentBasePrice) {
      psgFareSchema += psgFare.equivalentBasePrice.substring(3) + '-';
    } else {
      psgFareSchema += psgFare.basePrice.substring(3) + '-';
    }

    psgFareSchema += psgFare.taxes.substring(3);
  }
  return psgFareSchema;
};

const fareSchema = fareObj => {
  let fareSchema = '';

  fareObj && fareObj.ADT ? (fareSchema += psgFareSchema(fareObj.ADT)) : null;
  fareObj && fareObj.CNN
    ? (fareSchema += '-' + psgFareSchema(fareObj.CNN))
    : null;
  fareObj && fareObj.INS
    ? (fareSchema += '-' + psgFareSchema(fareObj.INS))
    : null;

  return fareSchema;
};

// CXL BEF DEP-25GBP/CXL AFT DEP-NONREF/CHG FREE
// 'ORIGIN CHINA CHG FREE-0USD/CXL 4000CNY-4000CNY ORIGIN CHINA CXL-4000CNY/CHG-2000CNY'
const splitFareRule = fareRule => {
  const getRule = rule => {
    let ruleResult = '';
    if (rule.includes('FREE')) {
      ruleResult = 0;
    } else if (rule.includes('NON')) {
      ruleResult = 1;
    } else {
      const currency = rule.split('-')[1].substr(-3, 3);
      const price = rule.split('-')[1].slice(0, -3);
      ruleResult = price + '-' + currency;
    }
    return ruleResult;
  };

  const fareSplit = fareRule.split('/');
  let befCXL,
    aftCXL,
    chg = '';
  if (fareRule.includes('BEF')) {
    befCXL = fareSplit[0];
    aftCXL = fareSplit[1];
    chg = fareSplit[2];
  } else {
    befCXL = fareSplit[0];
    aftCXL = fareSplit[0];
    chg = fareSplit[1];
  }
  befCXL = getRule(befCXL);
  aftCXL = getRule(aftCXL);
  chg = getRule(chg);

  return befCXL + '/' + aftCXL + '/' + chg;
};

const penaltySchema = res => {
  let penaltySchema = '';
  if (
    res &&
    res['air:AirPriceResult'] &&
    res['air:AirPriceResult']['air:AirPricingSolution'] &&
    res['air:AirPriceResult']['air:FareRule']
  ) {
    /** 数据源，默认为第0个（待确认） */
    const solution =
      res['air:AirPriceResult']['air:AirPricingSolution'][
        Object.keys(res['air:AirPriceResult']['air:AirPricingSolution'])[0]
      ];

    /** 航段编号 */
    const segmentRefList =
      solution['air:AirSegmentRef'] && solution['air:AirSegmentRef'].length > 0
        ? solution['air:AirSegmentRef']
        : [];

    // if (segmentRefList.length == 0) {
    //   ctx.logger.info('segmentRefList Error', params.legs);
    //   return;
    // }

    /** 关联关系集合（成人、儿童、婴儿） */
    const priceInfo = solution['air:AirPricingInfo']
      ? solution['air:AirPricingInfo']
      : null;

    // if (priceInfo == null) {
    //   ctx.logger.info('priceInfo Error', params.legs);
    //   return;
    // }
    const segForwardRef = segmentRefList[0];
    const segBackwardRef =
      segmentRefList.length > 1 ? segmentRefList[1] : undefined;

    const fareRuleList = [];

    Object.keys(priceInfo).forEach(priceKey => {
      const priceKeyInfo = priceInfo[priceKey];
      let psyType = priceKeyInfo['air:PassengerType'][0];
      if (psyType instanceof Object) {
        psyType = psyType.Code;
      }
      const forwardFareInfoRef =
        priceKeyInfo['air:BookingInfo'].filter(
          b => b.SegmentRef == segForwardRef
        ).length > 0
          ? priceKeyInfo['air:BookingInfo'].filter(
            b => b.SegmentRef == segForwardRef
          )[0].FareInfoRef
          : '';
      const backwardFareInfoRef = segBackwardRef
        ? priceKeyInfo['air:BookingInfo'].filter(
          b => b.SegmentRef == segBackwardRef
        ).length > 0
          ? priceKeyInfo['air:BookingInfo'].filter(
            b => b.SegmentRef == segBackwardRef
          )[0].FareInfoRef
          : ''
        : '';
      fareRuleList.push({
        psyType,
        forwardFareInfoRef,
        backwardFareInfoRef,
      });
    });

    const fareRules = res['air:AirPriceResult']['air:FareRule'];

    fareRuleList.forEach(psgFareRef => {
      const fRefInfo =
        fareRules.filter(f => f.FareInfoRef == psgFareRef.forwardFareInfoRef)
          .length > 0
          ? fareRules.filter(
            f => f.FareInfoRef == psgFareRef.forwardFareInfoRef
          )[0]
          : null;
      if (!fRefInfo) return;
      const fFareRuleInfo =
        fRefInfo['air:FareRuleShort'].filter(f => f.Category == '16').length >
        0
          ? fRefInfo['air:FareRuleShort'].filter(f => f.Category == '16')[0]
          : null;
      if (!fFareRuleInfo) return;
      psgFareRef.forwardFareRule =
        fFareRuleInfo['air:FareRuleNameValue'] &&
        fFareRuleInfo['air:FareRuleNameValue'].Value
          ? fFareRuleInfo['air:FareRuleNameValue'].Value
          : '';

      const refInfo =
        fareRules.filter(f => f.FareInfoRef == psgFareRef.backwardFareInfoRef)
          .length > 0
          ? fareRules.filter(
            f => f.FareInfoRef == psgFareRef.backwardFareInfoRef
          )[0]
          : null;
      if (!refInfo) return;
      const fareRuleInfo =
        refInfo['air:FareRuleShort'].filter(f => f.Category == '16').length >
        0
          ? refInfo['air:FareRuleShort'].filter(f => f.Category == '16')[0]
          : null;
      if (!fareRuleInfo) return;
      psgFareRef.backwardFareRule =
        fareRuleInfo['air:FareRuleNameValue'] &&
        fareRuleInfo['air:FareRuleNameValue'].Value
          ? fareRuleInfo['air:FareRuleNameValue'].Value
          : '';
    });
    // console.log(fareRuleList);
    if (
      fareRuleList
        .filter(f => f.psyType === 'ADT')[0]
        .forwardFareRule.includes('CONDITIONS')
    ) {
      penaltySchema = splitFareRule(
        fareRuleList.filter(f => f.psyType == 'ADT')[0].backwardFareRule
      );
    } else {
      penaltySchema = splitFareRule(
        fareRuleList.filter(f => f.psyType == 'ADT')[0].forwardFareRule
      );
    }

    if (
      fareRuleList
        .filter(f => f.psyType == 'CNN')[0]
        .forwardFareRule.includes('CONDITIONS')
    ) {
      penaltySchema +=
        '$' +
        splitFareRule(
          fareRuleList.filter(f => f.psyType == 'CNN')[0].backwardFareRule
        );
    } else {
      penaltySchema +=
        '$' +
        splitFareRule(
          fareRuleList.filter(f => f.psyType == 'CNN')[0].forwardFareRule
        );
    }

    if (
      fareRuleList
        .filter(f => f.psyType == 'INS')[0]
        .forwardFareRule.includes('CONDITIONS')
    ) {
      penaltySchema +=
        '$' +
        splitFareRule(
          fareRuleList.filter(f => f.psyType == 'INS')[0].backwardFareRule
        );
    } else {
      penaltySchema +=
        '$' +
        splitFareRule(
          fareRuleList.filter(f => f.psyType == 'INS')[0].forwardFareRule
        );
    }
  }
  return penaltySchema;
};


module.exports = { response2Schema, fareSchema, penaltySchema };

/*
Value:[  DepartureTime-DepartureOffet-AirlineCode-FlightNumber-AirlineClass-DeparturePort-DepartureStation-ArrivalPort-ArrivalStation/
         TransOffset*
         DepartureTime-DepartureOffet-AirlineCode-FlightNumber-AirlineClass-DeparturePort-DepartureStation-ArrivalPort-ArrivalStation/
         TransOffset*
         DepartureTime-DepartureOffet-AirlineCode-FlightNumber-AirlineClass-DeparturePort-DepartureStation-ArrivalPort-ArrivalStation|
         ADTBase-ADTTaxes-CHDBase-CHDTaxes-INSBase-INSTaxes
      ]
- Example
  1810-0250-AY-1338-E&Y-LHR-T3-HEL-T2/
  1750/
  1650-0855-AY-0087-B&U-PVG-T2/
  2000-500-1000-500-500-500
*/
