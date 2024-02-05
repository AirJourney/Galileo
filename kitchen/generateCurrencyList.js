const currencies = ['HKD', 'CNY', 'MYR', 'TWD', 'EUR','USD'];
const pairs = [];
for (let i = 0; i < currencies.length; i++) {
  for (let j = i + 1; j < currencies.length; j++) {
    pairs.push({ from: currencies[i], to: currencies[j] });
    pairs.push({ from: currencies[j], to: currencies[i] });
  }
}
const uniquePairs = [...new Set(pairs.map(JSON.stringify))].map(JSON.parse);
console.log(JSON.stringify(uniquePairs));