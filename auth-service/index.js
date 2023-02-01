const express = require("express")
const app = express()
const PORT = process.env.PORT || 6004
const mongoose = require("mongoose")
const User = require("./models/User")
const jwt = require("jsonwebtoken")
app.use(json())

//connect to mongodb backend
mongoose
.connect(process.env.MONGO_URL)
.then(()=>console.log("dbconnection successful"))
.catch((err) => {
    console.log(err)
})
//register logic
app.post("/auth/register", async(req, res) => {
    const {email, password, name} = req.body;
    const userExists = await User.findOne({ email })
    if (userExists) {
        return res.json({ message : "User already exists" })
    }else{
        const newUser = new User({
            name, 
            email,
            password
        })
        newUser.save()
        return res.json(newUser)
    }
})
//login logic
app.post("/auth/login", async(req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email })
    if (!user) {
        return res.json({ message : "User does not exist" })
    }else{
        //check if password is correct 
        if(password !== user.password) {
            return res.json({ message: "password do not match" })
        }
        const payload = {
            email,
            name: user.name
        }
        jwt.sign(payload, "secret", (err, token) => {
            if (err) console.log(err)
            else{
                return res.json({ token : token})
            }
        })
    }
})

app.listen(PORT, () => {
    console.log(`Auth service at ${PORT}`)
})