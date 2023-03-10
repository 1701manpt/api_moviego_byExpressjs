const express = require('express')

const router = express.Router()

// controllers
const { getAll, getById, create, destroy, getAvailableSeats } = require('~/controllers/v1/seat')

router.get('/', getAll)
router.get('/available', getAvailableSeats)
router.get('/:id', getById)
router.post('/', create)
router.delete('/:id', destroy)

module.exports = router
