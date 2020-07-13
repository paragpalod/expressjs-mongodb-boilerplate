const morgan = require('morgan');

// this funtion will log method, url, status code, time taken to executre the api and if response is sent than response will also be logged
const logFunction = (tokens, req, res) => `
  ${tokens.method(req, res).yellow} ${tokens.url(req, res).green} ${tokens.status(req, res).blue} ${tokens['response-time'](req, res)} ms`.bgBlack.bold + '\n';

const morgonMiddleware = morgan(logFunction);

module.exports = morgonMiddleware;
