const express = require("express")
const app = express()
const PORT = process.env.PORT || 6080
const mongoose = require("mongoose")
const amqp = require("amqplib")
const isAuthenticated = require("../isAuthenticated")
const Product = require("./models/Product")
app.use(json())

var channel, connection

//connect to mongodb backend
mongoose
.connect(process.env.MONGO_URL)
.then(()=>console.log("dbconnection successful"))
.catch((err) => {
    console.log(err)
})

async function connect(){
    const amqpServer = "amqp://localhost:5672"
    connection = await amqp.connect(amqpServer)
    channel = await connection.createChannel()
    await channel.assertQueue("PRODUCT")
}
connect()

//create a product
app.post("/product/create", isAuthenticated, async (req, res) => {
    const { name, description, price } = req.body
    const newProduct = new Product({
        name,
        description,
        price
    })
    newProduct.save()
    return res.json(newProduct)
})

//buy a product
app.post("/product/buy", isAuthenticated, async (req, res) => {
    const { ids } = req.body
    const products = await Product.find({
        _id: { $in : ids }
    })

    channel.sendToQueue(
        "ORDER",
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email
            })
        )
    )

    channel.consume("PRODUCT", (data) => {
        order = JSON.parse(data.content)
        channel.ack(data)
    })
    return res.json(order)
})



app.listen(PORT, () => {
    console.log(`Auth service at ${PORT}`)
})