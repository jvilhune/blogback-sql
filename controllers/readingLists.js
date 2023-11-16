const router = require('express').Router()
const { tokenExtractor } = require('../util/middleware')

const ReadingList = require('../models/reading_list')

router.post('/', async (req, res) => {
  console.log('POST READINGLIST')
  const { blogId, userId } = req.body
  const readingList = await ReadingList.create({ blogId, userId })
  res.json(readingList)
})

router.get('/', async (req, res) => {
  const readingList = await ReadingList.findAll()
  res.json(readingList)
})

router.put('/:id', tokenExtractor, async (req, res) => {
  const { id } = req.params
  const readingList = await ReadingList.findByPk(id)

  if (readingList) {
    const updateList = req.body.read ? await readingList.update({
      read: req.body.read,
    }) : res.status(400).json({ error: 'missing read content' })
    res.json(updateList)

  }
  res.status(404).end();
})


module.exports = router