const express = require('express')
const router = require('express').Router()
const bcrypt = require('bcrypt')
const { User, Blog } = require('../models')
const ReadingList = require('../models/reading_list');
const { tokenExtractor } = require('../util/middleware')

const isAdmin = async (req, res, next) => {
  const user = await User.findByPk(req.decodedToken.id)
  if (!user.admin) {
    return res.status(401).json({ error: 'operation not permitted' })
  }
  next()
}

const userFinder = async (req, res, next) => {
  req.user = await User.findByPk(req.params.id)
  next()
} 

router.put('/:username', tokenExtractor, isAdmin, async (req, res) => {
  //console.log('USERNAME PARAM')
  const user = await User.findOne({ 
    where: { 
      username: req.params.username
    }
  })

  if (user) {
    user.name = req.body.name
    await user.save()
    res.json(user)
  } else {
    res.status(404).end()
  }
})

router.put('/userrights/:id', tokenExtractor, isAdmin, userFinder, async (req, res) => {
  //console.log('ID PARAM')
  const user = req.user
  if (user) {
    user.disabled = req.body.disabled
    await user.save()
    res.json(user)
  } else {
    res.status(404).end()
  }
})

router.get('/', async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['passwordhash'] }, 
    include: [
      {
        model: Blog,
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] } 
      },
    ]
  })
  res.json(users)
})

router.post('/', async (req, res) => {
  try {   

    if (req.body.password.length < 3) {
      return response.status(401).json({ error: 'password invalid. should be at least 3 characters' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(req.body.password, saltRounds)

    var varuserObject = {
      username: req.body.username,
      name: req.body.name,
      passwordhash: passwordHash
    }

    const retuser = await User.create(varuserObject)

    var resuserObject = {
      username: retuser.username,
      name: retuser.name
    }
    res.json(resuserObject)
  } catch(error) {
    return res.status(400).json({ error })
  }
})


/* READING LISTS */
/* Check models/index.js file : User.belongsToMany(Blog, { through: ReadingList, as: 'readings' }) */
/* Returns the whole reading list - GET /api/users/:id */
/* Returns read blogs - GET /api/users/:id?read=true */
/* Returns unread blogs - GET /api/users/:id?read=false */
/* Mark the blog in own reading list as read - PUT /api/readinglists/:id { read: true } */
/* Add blog to reading list - POST /api/readinglists { blog_id: 4, user_id: 3 } */
/* Get reading lists - GET /api/readinglists */

router.get('/:id', async (req, res) => {
  console.log('req.params.id', req.params.id)
  console.log('req.query.read', req.query.read)
  const { id } = req.params;
  let where = {}
  const user = await User.findByPk(id, {
    //where: { id: req.params.id }, //userId },
    //attributes: ['name', 'username','disabled'],

    /* User */
    attributes: ['id', 'name', 'username', 'admin', 'disabled', 'createdAt', 'updatedAt'],
    //where,
    include: [
      {
        /* User's own blogs */
        model: Blog,
        attributes: ['id', 'title', 'author', 'url', 'likes', 'year', 'userId', 'createdAt','updatedAt'],
        //attributes: { exclude: ['userId'] }, 
      },
      {
        /* Blogs that this user has marked to his reading list */
        model: Blog,
        as: 'readings',
        //attributes: ['id', 'title', 'author', 'url', 'likes', 'year', 'userId', 'createdAt','updatedAt'],
        //attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] },
        through: {
          attributes: [],
        },
        
        include: [
          {
            /* Shows all reading lists connected to this blog, i.e. also reading lists marked to this blog by other users */
            model: ReadingList,
            //attributes: ['read', 'id'],
            attributes: ['id', 'userId', 'blogId', 'read'],
            /* Request can be GET /api/users/:id?read=true or GET /api/users/:id?read=false or GET /api/users/:id (req.query.read is null, undefined) */
            /* According to the request */
            /* Return ReadingLists where req.query.read = true or */
            /* Return ReadingLists where req.query.read = false or */
            /* Return ReadingLists where req.query.read = true or req.query.read = false */
            where: req.query.read != null
            ? { read: req.query.read }
            : { },
          },          
        ],        
      },      
    ],    
  });
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: `User with id ${id} not found`});
  }
});

module.exports = router