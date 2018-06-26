const Chance = require('chance');
const chance = new Chance();

console.log(chance.paragraph());
console.log(chance.name());
console.log(chance.avatar());
console.log(chance.animal({type: 'pet'}))