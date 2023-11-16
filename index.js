//npm install express dotenv pg sequelize
//npm install jsonwebtoken
//npm install umzug
//npm install bcrypt
//npm install --save-dev nodemon
//npm install uuid
//npm install express-async-errors

const express = require('express')
require('express-async-errors');
const app = express()

const { PORT } = require('./util/config')
const { connectToDatabase } = require('./util/db')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users')
const authorsRouter = require('./controllers/authors')
const loginRouter = require('./controllers/login')
const logoutRouter = require('./controllers/logout')
const readingListRouter = require('./controllers/readingLists')
const { errorHandler } = require('./util/middleware')

app.use(express.json())

app.use('/api/blogs', blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/authors', authorsRouter)
app.use('/api/login', loginRouter)
app.use('/api/login', logoutRouter)
app.use('/api/readinglists', readingListRouter)
app.use(errorHandler)

const start = async () => {
  await connectToDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

start()