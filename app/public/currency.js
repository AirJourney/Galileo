/**
 * [
  { from: 'GBP', to: 'EUR', rate: 1.198419 },
  { from: 'CNY', to: 'EUR', rate: 0.141913 },
  { from: 'USD', to: 'EUR', rate: 0.895595 },
  { from: 'CHF', to: 'EUR', rate: 0.975239 },
  { from: 'EUR', to: 'HKD', rate: 8.728126 }
]
 */

const currencySchema = (currencyList) => {
  if (!currencyList || currencyList.length == 0) {
    return [];
  }
  const currencySchemaList = [];
  for (let i = 0; i < currencyList.length; i++) {
    const curSchema = {
      key: currencyList[i].from + "2" + currencyList[i].to,
      val: currencyList[i].rate,
    };
    currencySchemaList.push(curSchema);
  }
  return currencySchemaList;
};

module.exports = { currencySchema };
