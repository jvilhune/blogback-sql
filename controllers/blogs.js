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
    /* likes param do nothing, just testing it here */
    /* GET http://localhost:3001/api/blogs?search=Martin */
    /* GET http://localhost:3001/api/blogs?search=Martin&likes=88 */

    where.likes = req.query.likes
  }

  if (req.query.search) {
    where.author = {
      [Op.substring]: req.query.search
    }

    where.title = {
      [Op.substring]: req.query.search
    }
  }
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

  if (!req.blog) {
    res.status(404).end()
  } else if (!user || user.id !== req.blog.userId) {
    res.status(401).json({ error: 'Unathorized user to delete this blog' });
  }
  else if (req.blog && (req.blog.userId === user.id)) {
    /*
    console.log('req.blog.id', req.blog.id)
    console.log('req.blog.userId', req.blog.userId)
    console.log('req.blog.title', req.blog.title)
    */

    await req.blog.destroy()
    res.status(204).end()
  }
  else {
    res.status(404).end()
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



