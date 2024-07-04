import mongoose from "mongoose";
require('dotenv').config();


const dbUrl:string = process.env.DB_URL || '';


const connectDB = async()=>{
    try {
        await mongoose.connect(dbUrl);
        
        console.log("Database connected")

        mongoose.connection.on('error', (error) =>{
            console.log('Database connection error', error)
        })
    } catch (error:any) {
        console.log('Database could not connect to DB:', error.toString())
        setTimeout(connectDB, 5000);
    }
}

export default connectDB;