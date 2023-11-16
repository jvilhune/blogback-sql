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


/*
router.put('/', tokenExtractor, isAdmin, async (req, res) => {
  var user
  if(req.params.id) {
    user = await User.findByPk(req.params.id)
    if (user) {
      user.disabled = req.body.disabled
      await user.save()
      res.json(user)
    }
    else {
      res.status(404).end()
    }
  }
  else if(req.params.username) {
    user = await User.findOne({ 
      where: { 
        username: req.params.username
      }
    })

    if (user) {
      user.name = req.body.name
      await user.save()
      res.json(user)
    }
    else {
      res.status(404).end()
    }
  }
})
*/

router.put('/:username', tokenExtractor, isAdmin, async (req, res) => {
  console.log('USERNAME PARAM')
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
  console.log('ID PARAM')
  const user = req.user
  if (user) {
    user.disabled = req.body.disabled
    await user.save()
    res.json(user)
  } else {
    res.status(404).end()
  }
})




/* */

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
  console.log('send user occurred')
  console.log('req.body', req.body)
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

    console.log('resuserObject', resuserObject)

    res.json(resuserObject)
  } catch(error) {
    return res.status(400).json({ error })
  }
})


router.get('/:id', async (req, res) => {
  const { id } = req.params;
  let where = {}
  const user = await User.findByPk(id, {
    where: { id: req.params.userId },
    attributes: ['name', 'username','disabled'],
    where,
    include: [
      {
        model: Blog,
        as: 'readings',
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] },
        through: {
          attributes: [],
        },
        
        include: [
          {
            model: ReadingList,
            attributes: ['read', 'id'],
            where: req.query?.read != null
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