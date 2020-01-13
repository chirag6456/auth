const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SportsSchema = new Schema({
  name : {
      type : String,
      required : true
    },
  players : {
    type : Number,
    required : true
  },
  type : {
    type : String,
    required : true
  }
});

module.exports = Sports = mongoose.model("sports", SportsSchema);

