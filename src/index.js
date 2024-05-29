// require("dotenv").config({path:"./env"})
import connectDB from "./db/index.js";
import dotenv from 'dotenv';
import { app } from "./app.js";


dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`Server is running at PORT :${process.env.PORT}`);
  })
})
.catch((err)=>{
  console.log(`MONGO DB connection failed!!!`,err);
})

/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGOBD_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERR:", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR", error);
    throw error;
  }
})();
*/