const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const router = require('express').Router()
const { SECRET } = require('../util/config')
const User = require('../models/user')
const { v4: uuidv4 } = require('uuid');

router.post('/', async (request, response) => {
  const body = request.body
  const { username, password } = request.body

  const user = await User.findOne({ 
    where: { 
      username: body.username
    }
  })

  var passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordhash)
  
  //passwordCorrect = body.password === 'salainen'

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username, 
    id: user.id,
  }

  if (user.disabled) {
    return response.status(401).json({
      error: 'account disabled, please contact admin'
    })
  }

  const token = jwt.sign(userForToken, SECRET,  {
    expiresIn: '1d',
    jwtid: uuidv4(),
  });

  response.status(200).json({ token, ...userForToken })
})


module.exports = router
