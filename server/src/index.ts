import  express  from "express";
import 'dotenv/config';
import './db/index'

const app = express();

const PORT = 8989;
app.listen(PORT, ()=>{
    console.log('Port is listening on port '+ PORT);
});
