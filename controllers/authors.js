const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { Op } = require('sequelize')

const { tokenExtractor } = require('../util/middleware')
const { Blog, User } = require('../models')
const { SECRET } = require('../util/config')
const { sequelize } = require('../util/db')

router.get('/', async (req, res) => {
  const authors = await Blog.findAll({
    attributes: [
      'author',
      [sequelize.fn('COUNT', sequelize.col('id')), 'blogs'],
      [sequelize.fn('SUM', sequelize.col('likes')), 'likes'],
    ],
    group:'author',
    order:[['likes', 'DESC']],
  });
  res.json(authors);
})


/*
router.get('/', async (req, res) => {
  const where = {}

  var blogs

    blogs = await Blog.findAll({
    attributes: ['likes', 'author'],
    //attributes: { exclude: ['id', 'title', 'url', 'date', 'userId'] },    
    include: {
      model: User,
      //attributes: ['name', 'username']
      attributes: { exclude: ['name', 'username', 'id', 'passwordhash', 'admin', 'disabled'] },
    },
    where
  })

  console.log('where', where)
  res.json(blogs)
})
*/

module.exports = router
