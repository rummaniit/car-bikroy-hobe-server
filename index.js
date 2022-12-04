const { MongoClient, ServerApiVersion, ObjectId, ObjectID } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express()
app.use(cors())
app.use(express.json())
require('dotenv').config()
const port = process.env.PORT || 5000



const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@cluster0.xteb5ll.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const carCollection = client.db('car-bikroy').collection('allcars');
        const userCollection = client.db('car-bikroy').collection('allusers')
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

        app.get('/allusers', async (req, res) => {

            const result = await userCollection.find({}).toArray()
            res.send(result)
            console.log(result);
        });

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
