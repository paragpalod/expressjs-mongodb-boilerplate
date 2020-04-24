module.exports = function (Schema) {
  const User = new Schema({
    email: {
      required: true,
      type: String,
      unique: true
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    mobile: {
      type: String,
      required: true,
      unique: true
    }
  }, { timestamps: true });

  return User;
};
