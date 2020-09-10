const mongoose = require('mongoose');
const {Schema} = mongoose;

const sentEmailSchema = new Schema(
    {
        username: {
            type: String,
        },

        email: {
            type: String,
        },
        sentEmailFlag:{
            type: String, 
            default: false
        },
        date:{
            type: Date, 
            default: Date.now
        }
    },
    { timestamps: true }
);

mongoose.model('sentemails', sentEmailSchema);