const { CatchError } = require('../../../utils/error');

const aDummyAPI = async (req, res) => {
  try {
    // do something
    const condition = 'true || false'
    if (condition) {
      throw {
        message: 'If Error throw some message',
        statusCode: 400 // if not passed will throw 400
      }
    }
    res.send('');// return some data from this API
  } catch (Exception) {
    CatchError(Exception, res);
  }
};

module.exports = (router) => {
  router.get('/dummyAPICall', [
    // express validator conditions always validate your input
  ], aDummyAPI)
}
