const history = [0, 1, 2, 3]

const h1 = [...history].slice(0, history.length + 1)
console.log("Debug__h1 :", h1)

const h2 = [...history].slice(0, history.length - 1)
console.log("Debug__h2 :", h2)