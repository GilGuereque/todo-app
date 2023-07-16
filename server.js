const express = require('express')
const app = express()
const MongoClient = require('mongodb').MongoClient
const PORT = 2121
require('dotenv').config()


let db,
    dbConnectionStr = process.env.DB_STRING,
    dbName = 'todo'

MongoClient.connect(dbConnectionStr, { useUnifiedTopology: true })
    .then(client => {
        console.log(`Connected to ${dbName} Database`)
        db = client.db(dbName)
    })
    
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

//// Original Code for Main GET request
//// Renamed the documents inside the array (TODOS) to items, so in EJS template if you see items it is your todo documents
// app.get('/',async (request, response)=>{
//     const todoItems = await db.collection('todos').find().toArray()
//     const itemsLeft = await db.collection('todos').countDocuments({completed: false})
//     response.render('index.ejs', { items: todoItems, left: itemsLeft })
//     // db.collection('todos').find().toArray()
//     // .then(data => {
//     //     db.collection('todos').countDocuments({completed: false})
//     //     .then(itemsLeft => {
//     //         response.render('index.ejs', { items: data, left: itemsLeft })
//     //     })
//     // })
//     // .catch(error => console.error(error))
// })


//Refactored GET request to main with included error handling if a server error occurs
app.get('/', async (request, response)=>{
    try {
        const todoItems = await db.collection('todos').find().toArray();
        const itemsLeft = await db.collection('todos').countDocuments({completed: false});
        response.render('index.ejs', {items: todoItems, left: itemsLeft});
    } catch (error) {
        console.error(error);
        response.status(500).send('500 HTTP Status code. A server error has ocurred.');
    }
});

app.post('/addTodo', (request, response) => {
    db.collection('todos').insertOne({thing: request.body.todoItem, completed: false})
    .then(result => {
        console.log('Todo Added')
        response.redirect('/')
    })
    .catch(error => console.error(error))
})

app.put('/markComplete', (request, response) => {
    db.collection('todos').updateOne({thing: request.body.itemFromJS},{
        $set: {
            completed: true
          }
    },{
        sort: {_id: -1},
        upsert: false
    })
    .then(result => {
        console.log('Marked Complete')
        response.json('Marked Complete')
    })
    .catch(error => console.error(error))

})

app.put('/markUnComplete', (request, response) => {
    db.collection('todos').updateOne({thing: request.body.itemFromJS},{
        $set: {
            completed: false
          }
    },{
        sort: {_id: -1},
        upsert: false
    })
    .then(result => {
        console.log('Marked Complete')
        response.json('Marked Complete')
    })
    .catch(error => console.error(error))

})

// original delete request 
// app.delete('/deleteItem', (request, response) => {
//     db.collection('todos').deleteOne({thing: request.body.itemFromJS})
//     .then(result => {
//         console.log('Todo Deleted')
//         response.json('Todo Deleted')
//     })
//     .catch(error => console.error(error))
// })

// refactored code including error handling and async/await
app.delete('/deleteItem', async (request, response) => {
    try {
        await deleteItem(request.body.itemFromJS);
        console.log('Todo Deleted');
        response.json('Todo Deleted');
    } catch (error) {
        console.error(error);
        response.status(500).send(error);
    }
});

// async function to delete item and throw error message if needed
async function deleteItem(item) {
    const deletionResult = await db.collection('todos').deleteOne({thing: item});
    if (deletionResult.deletedCount === 0) {
        throw new Error('No todo with this item found to delete');
    }
}

// listen request and port variable
app.listen(process.env.PORT || PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})
