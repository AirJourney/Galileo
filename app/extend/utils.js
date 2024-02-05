const moment = require("moment");

function getTokenInfo(jwt, auth, secret) {
  // 判断请求头是否包含token
  if (auth.authorization && auth.authorization.split(" ")[0] === "Bearer") {
    const token = auth.authorization.split(" ")[1];
    let decode = "";
    if (token) {
      decode = jwt.verify(token, secret);
    }
    return decode;
  }
  return;
}

const diffTime = (t1, t2) => {
  t1 = moment(t1);
  t2 = moment(t2);
  var duration = t2.diff(t1, "minute");
  const h = Math.floor(duration / 60); //相差的小时数
  const m = duration % 60; //计算相差小时后余下的分钟数
  // console.log(h + "-" + m);
  return {
    h,
    m,
  };
};

module.exports = {
  getTokenInfo,
  diffTime,
};
