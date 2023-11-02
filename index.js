
const express = require('express');
const app = express();
const ejs = require('ejs');
const morgan = require('morgan')

const session=require('express-session')
 const PORT = process.env.PORT || 3000;


const path = require('path');

app.use(session({
  secret: "session",
  resave: false,
  saveUninitialized: true
}))

const user_route = require('./routes/userRoute');
const admin_route = require('./routes/adminRoute');
const product_route=require('./routes/productRoute')
const category_route=require('./routes/categoryRoute')
// app.use(morgan("tiny"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static('public'));


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.set('views', path.join(__dirname, 'public'));

app.use("/",user_route)
app.use("/admin",admin_route)
app.use("/admin/products",product_route)
app.use("/admin/category",category_route)


app.listen(3000, () => {
  console.log(`Server started on port `);
});


