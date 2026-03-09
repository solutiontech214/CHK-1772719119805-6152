const app=require('./src/app');
const dotenv=require('dotenv');
const authRouter=require('./routes/auth.routes');
const connectDb=require('./db/db');
const makeRequest=require('./service/ai.service');           
const cookieParser = require('cookie-parser');
const uploadRouter = require('./routes/upload.routes');
connectDb();
dotenv.config();

app.use(cookieParser())
app.use('/api/auth',authRouter);
app.use('/api/auth',authRouter)
app.use('/api/auth',authRouter)
app.use('/api/auth',authRouter)
app.use('/api/upload',uploadRouter)
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})
