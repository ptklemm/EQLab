
const num = 25553333.3634534;

let test = Number(Number(num.toPrecision(14)).toFixed(6))

let test2 = Math.trunc(num.toPrecision(11))


console.log(test2)