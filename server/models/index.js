const fs = require('fs');
const path = require('path');
const basename = path.basename(module.filename);
const Directories = fs.readdirSync(__dirname)
const mongoose = require('mongoose');
const Files = []
const db = {}

Directories.filter(file => {
  return file !== basename;
}).map(file => {
  fs.readdirSync(path.join(__dirname, file)).map(f => Files.push({ name: f, path: path.join(__dirname, file) }))
})

// Set default values for mongoose connection
mongoose.Promise = global.Promise;
mongoose.set('debug', true);

/*
Create a mongoose connection to connect to the database.currently using local mongo instance
you have to install mongo on your machine to connecct to database otherwise add your
mongo atlas databse url in your envirnoment variable
*/
const Connection = mongoose.createConnection(
  'mongodb://localhost:27017/expressJsDev', // later add process.env.DATABASE_URL
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

Files.filter(file => {
  return (file.name.indexOf('.') !== 0) && (file.name.slice(-3) === '.js');
}).map(file => {
  return {
    model: require(path.join(file.path, file.name))(mongoose.Schema),
    modelName: file.name.substr(0, file.name.length - 3)
  }
}).map(file => {
  db[file.modelName] = Connection.model(file.modelName, file.model);
});

module.exports = db;
