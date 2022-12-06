const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express()
app.use(cors())
app.use(express.json())
var jwt = require('jsonwebtoken');
require('dotenv').config()
const stripe = require("stripe")('sk_test_51M9vT1KC3hoVsD4SUfoN84EZDwW4GGN4L4hLsCfErCa113BSsBce2QoVzIB4AtMKgqG8dosx4UMXHT17KT18IF4300zxauunsj');
const port = process.env.PORT || 5000



const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@cluster0.xteb5ll.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyToken = (req, res, next) => {
    // console.log('bearer', req.headers.authorization)
    const authHeader = req.headers.authorization
    if (!authHeader) {
        res.status(401).send('Unauthorizes Access')
    }
    const token = authHeader.split(' ')[1]
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            res.status(401).send('Fordiben Access')
        }
        req.decoded = decoded
        next()
    })

}

async function run() {
    try {
        const carCollection = client.db('car-bikroy').collection('allcars');
        const userCollection = client.db('car-bikroy').collection('allusers')
        const bookingCollection = client.db('car-bikroy').collection('allbookings')
        app.get('/allcars', async (req, res) => {
            const query = {}
            const result = await carCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/allproducts', async (req, res) => {
            let products = req.body
            console.log(products);
            console.log('products_name', products.category_name);
            const query2 = { category_name: products.category_name };
            console.log(query2);
            const movie = await carCollection.findOne(query2);
            if (movie) {

                carCollection.updateOne(
                    { category_name: products.category_name },
                    { $push: { category_products: products.category_products[0] } }
                )
            }
            else {
                const query = await carCollection.insertOne(products);
                res.send(query)
            }
        });
        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = {
                email: email
            }
            const result = await userCollection.findOne(query)
            if (result) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '5d' })
                return res.send({
                    accessToken: token
                })
            }
            console.log(result);
            res.status(403).send({
                accessToken: 'forbiden'
            })
        })

        app.get('/allproducts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await carCollection.find(query).toArray()
            res.send(result)
            console.log(result);
        })

        app.put('/available', async (req, res) => {
            const pname = req.query.name
            const updatedResult = await carCollection.updateOne({ 'category_products.p_name': pname, 'category_products.p_name': pname }, { $set: { "category_products.$.available": req.body.verify } })
            console.log(updatedResult);
        })

        app.put('/soldout', async (req, res) => {
            const pname = req.query.name
            const updatedResult = await carCollection.updateOne({ 'category_products.p_name': pname, 'category_products.p_name': pname }, { $set: { "category_products.$.available": req.body.verify } })
            console.log(updatedResult);
            res.send(updatedResult)
        })
        app.put('/deleteproduct', async (req, res) => {
            const pname = req.body.name
            const result = carCollection.updateOne(
                { 'category_products.p_name': pname },
                { $pull: { 'category_products': { 'p_name': pname } } },
                { upsert: false }
                // Upsert
                // / Multi
            );
            res.send(result)
        })
        app.post('/allusers', async (req, res) => {
            let userInfo = req.body
            console.log(userInfo);
            const result = await userCollection.insertOne(userInfo)
            res.send(result)
            console.log(result);
        });
        app.post('/allbooking', async (req, res) => {
            const allbookings = req.body
            const result = await bookingCollection.insertOne(allbookings)
            res.send(result)
        })
        app.get('/allbooking/users/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bookingCollection.findOne(query)
            res.send(result)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            // console.log(booking.items.productPrice);
            const price = parseInt(booking.items.carprice)
            console.log(price);
            const amount = price * 100;
            console.log('amount', amount);

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.get('/allbooking/user', verifyToken, async (req, res) => {
            const email = req.query.email
            const decodedEmail = req.decoded.email
            if (!email == decodedEmail) {
                res.status(401).send({
                    message: 'Forbiden Access'
                })
            }
            const query = {
                'currentUser': email
            }
            const result = await bookingCollection.find(query).toArray()
            console.log(result);
            res.send(result)
        })
        app.get('/allusers', async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result)
            console.log(result);
        });
        app.get('/allusers/byemail', async (req, res) => {
            const email = req.query.email
            const query = {
                email: email
            }
            const result = await userCollection.findOne(query)
            res.send(result)
        })

        app.delete('/deleteseller/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            var deleted = await userCollection.deleteOne(query)
            console.log(deleted);
            res.send(deleted)
        })
        app.delete('/deletebuyer/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            var deleted = await userCollection.deleteOne(query)
            console.log(deleted);
            res.send(deleted)
        })

        app.put('/verifyseller/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            userCollection.updateOne(
                { _id: ObjectId(id) },
                { $set: { "verify": true } }
            );
        })

        app.get('/sellerproducts', async (req, res) => {
            const email = req.query.email
            console.log(email);
            const query = { 'category_products.seller_email': email }
            const result = await carCollection.find(query).toArray()
            let array = []
            result.map(col => col.category_products.map(pr => {
                if (pr.seller_email === email) {
                    array.push(pr)
                }

            }))
            res.send(array)
        })
    } finally {

    }
}
run()







app.get('/', async (req, res) => {
    res.send('api is running')
})
app.listen(port, async (req, res) => {
    console.log(`'server running on',${port}`);
})
