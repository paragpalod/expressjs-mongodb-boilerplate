const CatchError = (Exception, res, Module) => {
  if (Exception.errors && Exception.errors[Object.keys(Exception.errors)[0]].message) {
    return res.status(400).send({ message: Exception.errors[Object.keys(Exception.errors)[0]].message });
  } else if (Exception && Exception.code === 11000) {
    return res.status(400).send({ message: `${Module} already exist` });
  } else {
    return res.status(Exception.statusCode || 400).send({ message: Exception.message });
  }
};

module.exports = {
  CatchError
};
