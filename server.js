// Import dependencies modules:
const express = require('express')
const cors = require('cors');
var path = require("path");
var fs = require("fs");
// Create an Express.js instance:
const app = express()
app.use(cors())
app.use(express.json())
app.set('port', 3000)


//logger middle ware
app.use ((req,res,next) => {
    console.log("Requests made " + req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers","*");
    next();
})


// connect to MongoDB
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect("mongodb+srv://mesum:saif@cluster0.qyb90.mongodb.net/test", (err, client) =>{

db = client.db('webstore')
})


// dispaly a message for root path to show that API is working
app.get('/', (req, res, next) => {
    res.send('Select a collection, e.g., /collection/messages')
})

// get the collection name
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    // console.log('collection name:', req.collection)
    return next()
})


// retrieve all the objects from an collection
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})


//adding post
app.post('/collection/:collectionName', (req, res, next) => {
req.collection.insert(req.body, (e, results) => {
    
if (e) return next(e)
res.send(results.ops)
})
})

/*app.param('searchName',  async (req, res, next, searchName)=>{
  //  req.search = await collection.find({topic : {$regex: new RegExp('^'+searchName+',*', 'i')}}).exec()
    req.search = await db.collection("lessons").find(searchName).toArray(function(err, result) {  
    return next()
})
})
*/

//Search request to search the database to find the lessons
app.post('/collection/:collectionName/search', (req, res, next) =>{
   let queery = req.body.search.trim()
   req.collection.find({
       topic : {$regex: new RegExp('^'+ queery+'.*', 'i')}
   }).toArray((e, results) => {
       
    if (e) return next(e)
        res.send(results)
    })

})

// return with object id 

const ObjectID = require('mongodb').ObjectID;
app.get('/collection/:collectionName/:id'
, (req, res, next) => {
req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
if (e) return next(e)
res.send(result)
})
})



//update an object 

app.put('/collection/:collectionName/:id', (req, res, next) => {
req.collection.update(
{_id: new ObjectID(req.params.id)},
{$set: req.body},
{safe: true, multi: false},
(e, result) => {
if (e) return next(e)
res.send((result.result.n === 1) ? {msg: 'success'} : {msg: 'error'})
})
})



// PUT route to reduce value of specified attribute of the record in database
app.put('/collection/:collectionName/:id/reduce/:name/:value', (req, res, next) => {
    let value = -1 * parseInt(req.params.value);
    let name = req.params.name;
    console.log(req.params)

    const attr = {};
    attr[name] = value;
    req.collection.updateOne(
        { _id: new ObjectID(req.params.id) },
        { "$inc":  attr},
        { safe: true, multi: false },
        (e, result) => {
            if(e || result.result.n !== 1) return next();
            res.json({ message: 'success' });
        });
});

//Static file middleware
app.use(function(req, res, next) {
    // Uses path.join to find the path where the file should be
    var filePath = path.join(__dirname, "image", req.url); 
    // Built-in fs.stat gets info about a file
     fs.stat(filePath, function(err, fileInfo) {
            if (err) {
                console.log("image file dose not exists")
                next();
                return; 
            }
    if (fileInfo.isFile()) res.sendFile(filePath);
            else next();
        });
    });


const port = process.env.PORT || 3000;
app.listen(port,()=> {console.log('express server is runnimg at localhost:3000')
})