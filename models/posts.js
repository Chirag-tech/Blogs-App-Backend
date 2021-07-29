const mongoose = require('mongoose');

const posts = new mongoose.Schema({
    title:String,
    postBody: String,
    createdAt: Date,
    updatedAt: Date,
    author: {
        id :{
            type:mongoose.Schema.Types.ObjectId,
            ref:"user"
        },
        username:String
    }
})

module.exports = mongoose.model("Posts", posts);