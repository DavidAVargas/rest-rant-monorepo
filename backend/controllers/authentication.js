const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')

const { User } = db

router.post('/:placeId/comments', async (req, res) => {
    const placeId = Number(req.params.placeId)

    req.body.rant = req.body.rant ? true : false

    const place = await Place.findOne({
        where: { placeId: placeId }
    })

    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` })
    }

    if (!req.currentUser) {
        return res.status(404).json({ message: `You must be logged in to leave a rand or rave.` })
    }

    const comment = await Comment.create({
        ...req.body,
        authorId: req.currentUser.userId,
        placeId: placeId
    })

    res.send({
        ...comment.toJSON(),
        author: req.currentUser
    })
})


router.get('/profile', async (req, res) => {
    res.json(req.currentUser)
    console.log(req.session.userId)
    try {
        let user = await User.findOne({
            where: {
                userId: req.session.userId                    
            }
        })
        res.json(user)
    } catch {
        res.json(null)
    }
})


module.exports = router
