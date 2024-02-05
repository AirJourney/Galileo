const moment = require("moment");

const getTime = (timeStr, timeType) => {
  // const split = timeStr.split("T");
  // const hm = split[1].split(":");
  // const hour = hm[0];
  // const m = hm[1];

  
  let timeResult = "";
  // switch (timeType) {
  //   case "H":
  //     timeResult = hm[0];
  //     break;
  //   case "M":
  //     timeResult = hm[1];
  //     break;
  //   default:
  //     break;
  // }

  const date = moment.parseZone(timeStr);
  switch (timeType) {
    case "H":
      timeResult = date.format('HH');
      break;
    case "M":
      timeResult = date.format('mm');
      break;
      case "Z":
        timeResult = date.format('Z').split(':')[0].substring(0,1)+Number(date.format('Z').split(':')[0].substring(1,3)).toString()
        break;
    default:
      break;
  }
 
  return timeResult;
};

const diffTime = (t1, t2) => {
  t1 = moment.parseZone(t1);
  t2 = moment.parseZone(t2);
  const duration = t2.diff(t1, "minute");
  let h = Math.floor(duration / 60); //相差的小时数
  let m = duration % 60; //计算相差小时后余下的分钟数
  h = h.toString().length < 2 ? "0" + h.toString() : h.toString();
  m = m.toString().length < 2 ? "0" + m.toString() : m.toString();
  // console.log(h + "-" + m);
  return {
    h,
    m,
  };
};

const addDay = (i) => {
  var newDay = moment().add(i, "d").format("YYYY-MM-DD"); // 三月 28 号
  return newDay;
};

const compareDate = (dateStr) => {
  let needDel = false;
  const nowDate = moment();
  const year = moment().year();
  const keyDate = moment(
    `${year}-${dateStr.substr(0, 2)}-${dateStr.substr(2, 2)}`
  );

  if (nowDate > keyDate) {
    needDel = true;
  }

  return needDel;
};

module.exports = {
  getTime,
  diffTime,
  addDay,
  compareDate,
};
