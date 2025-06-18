import connectDB from "./config/db.js";
import { app } from "./app.js"

import dotenv from "dotenv"

dotenv.config({})

connectDB()
.then (
    () =>{
        app.on('error', (error) => {
            console.log('Error', error);
            throw error
        })

        app.listen(process.env.PORT || 9000, () =>{
            console.log(`Server is listning on PORT : ${process.env.PORT}`);
            
        })
    }
)
.catch( 
    (error) =>{
        console.log('Database Connection Failed !! ', error)
    }
)