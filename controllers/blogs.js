const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const { tokenExtractor } = require('../util/middleware')
const { Blog, User } = require('../models')
const { SECRET } = require('../util/config')
const { sequelize } = require('../util/db')

const init = async function () {
  var a = 0;
  console.log('hello world');
  const where = {}

  const blogs = await Blog.findAll({ 
    attributes: { exclude: ['date', 'userId'] },
    include: {
      model: User,
      attributes: ['name', 'username']
    },
    where
  })

  console.log('blogs.length', blogs.length);

  for(a=0;a<blogs.length;a++) {
    console.log(blogs[0].dataValues.title + ', ' + blogs[a].dataValues.author + ', ' + blogs[a].dataValues.url + ', ' +  blogs[a].dataValues.likes)
  }
};

router.get('/', async (req, res) => {
  const where = {}

  if (req.query.likes) {
    where.author = req.query.likes
  }

  if (req.query.search) {

    where.author = {
      [Op.substring]: req.query.search
    }

    where.title = {
      [Op.substring]: req.query.search
    }
  }

  //console.log('where', where)
  var blogs
  if (req.query.search) {
    blogs = await Blog.findAll({
      attributes: { exclude: ['userId'] },
      include: {
        model: User,
        attributes: ['name', 'username']
      },
      where: {
        [Op.or]: [
          {
            title: {
              [Op.substring]: req.query.search
            }
          },
          {
            author: {
              [Op.substring]: req.query.search
            }
          }
        ]
      },
      order: [
        ['likes', 'DESC'],
      ],
    })

    console.log('where', where)
    res.json(blogs)
  }
  else {
    blogs = await Blog.findAll({ 
      attributes: { exclude: ['userId'] },
      include: {
        model: User,
        attributes: ['name', 'username']
      },
      where
    })
    res.json(blogs)
  }
})

/*
router.get('/', async (req, res) => {
  const where = {}

  if (req.query.important) {
    where.important = req.query.important === "true"
  } 

  if (req.query.search) {
    where.title = {
      [Op.substring]: req.query.search
    }
  }

  const blogs = await Blog.findAll({ 
    attributes: { exclude: ['date', 'userId'] },
    include: {
      model: User,
      attributes: ['name', 'username']
    },
    where
  })

  res.json(blogs)
})
*/
router.post('/', tokenExtractor, async (req, res) => {
  try {
    const user = await User.findByPk(req.decodedToken.id)
    const blog = await Blog.create({...req.body, userId: user.id})
    res.json(blog)
  } catch(error) {
    console.log(error)
    return res.status(400).json({ error })
  }
})

const blogFinder = async (req, res, next) => {
  req.blog = await Blog.findByPk(req.params.id)
  next()
} 

router.get('/:id', blogFinder, async (req, res) => {
  if (req.blog) {
    res.json(req.blog)
  } else {
    res.status(404).end()
  }
})

router.delete('/:id', tokenExtractor, blogFinder, async (req, res) => {
  const user = await User.findByPk(req.decodedToken.id)

  /*
  console.log('user.id', user.id)
  console.log('user.username', user.username)
  console.log('user.name', user.name)
  console.log('user.passwordhash', user.passwordhash)
  */

  if (req.blog && (req.blog.userId === user.id)) {
    /*
    console.log('req.blog.id', req.blog.id)
    console.log('req.blog.userId', req.blog.userId)
    console.log('req.blog.title', req.blog.title)
    */

    await req.blog.destroy()
    res.status(204).end()
  }
  else {
    res.status(400).end()
  }
})

router.put('/:id', blogFinder, async (req, res) => {
  if (req.blog) {
    req.blog.likes = req.body.likes
    await req.blog.save()
    res.json(req.blog)
  } else {
    res.status(404).end()
  }
})

module.exports = router
//module.exports = { init }


/*
POST http://localhost:3001/api/notes
Content-Type: application/json
Authorization: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imp2aWxodW5lIiwiaWQiOjEsImlhdCI6MTY5OTY3NzE4NH0.y1PEG0889TkUKNNUwAMQsEKmXBGrdRvi5vtxpZs-mFI

{
  "content": "For the cloud service platforms Fly.io and Heroku it is possible to create a Postgres (PostgreSQL) database for the application",
  "important": true
}
*/

/*
{
  "id": 8,
  "content": "For the cloud service platforms Fly.io and Heroku it is possible to create a Postgres (PostgreSQL) database for the application",
  "important": true,
  "userId": 1,
  "date": "2023-11-11 04:39:04.450 +00:00"
}
*/

