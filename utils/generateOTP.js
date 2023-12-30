const randomInt = require('./randomInteger');


const generateArray = (size, min, max) => {
    return [... new Array(size)].map(el => randomInt(min, max));
}


module.exports = (length = 4) => {
    return generateArray(4, 0, 10).join('');
}