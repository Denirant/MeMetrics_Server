const basicInfo = require('./basicInfo');
const servers = require('./servers');
const components = require('./components');
// const tags = require('./tags');
const user = require('./user');

module.exports = {
    ...basicInfo,
    ...servers,
    ...components,
    // ...tags,
    ...user
};