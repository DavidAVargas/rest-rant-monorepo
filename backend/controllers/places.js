const router = require('express').Router();
const db = require("../models");

const { Place, Comment, User } = db;

function isAdmin(req, res, next) {
    if (req.currentUser?.role !== 'admin') {
        return res.status(403).json({ message: 'You are not allowed to perform this action' });
    }
    next();
}

router.post('/', isAdmin, async (req, res) => {
    if (!req.body.pic) {
        req.body.pic = 'http://placekitten.com/400/400';
    }
    if (!req.body.city) {
        req.body.city = 'Anytown';
    }
    if (!req.body.state) {
        req.body.state = 'USA';
    }
    const place = await Place.create(req.body);
    res.json(place);
});

router.get('/', async (req, res) => {
    const places = await Place.findAll();
    res.json(places);
});

router.get('/:placeId', async (req, res) => {
    let placeId = Number(req.params.placeId);
    if (isNaN(placeId)) {
        return res.status(404).json({ message: `Invalid id "${placeId}"` });
    }
    const place = await Place.findOne({
        where: { placeId: placeId },
        include: {
            association: 'comments',
            include: 'author'
        }
    });
    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` });
    }
    res.json(place);
});

router.put('/:placeId', isAdmin, async (req, res) => {
    let placeId = Number(req.params.placeId);
    if (isNaN(placeId)) {
        return res.status(404).json({ message: `Invalid id "${placeId}"` });
    }
    const place = await Place.findOne({
        where: { placeId: placeId },
    });
    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` });
    }
    Object.assign(place, req.body);
    await place.save();
    res.json(place);
});

router.delete('/:placeId', isAdmin, async (req, res) => {
    let placeId = Number(req.params.placeId);
    if (isNaN(placeId)) {
        return res.status(404).json({ message: `Invalid id "${placeId}"` });
    }
    const place = await Place.findOne({
        where: { placeId: placeId }
    });
    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` });
    }
    await place.destroy();
    res.json(place);
});

router.post('/:placeId/comments', async (req, res) => {
    const placeId = Number(req.params.placeId);
    req.body.rant = req.body.rant ? true : false;

    const place = await Place.findOne({
        where: { placeId: placeId }
    });

    if (!place) {
        return res.status(404).json({ message: `Could not find place with id "${placeId}"` });
    }

    const currentUser = await User.findOne({
        where: { userId: req.session.userId }
    });

    if (!currentUser) {
        return res.status(404).json({ message: `You must be logged in to leave a rant or rave.` });
    }

    const comment = await Comment.create({
        ...req.body,
        authorId: currentUser.userId,
        placeId: placeId
    });

    res.json({
        ...comment.toJSON(),
        author: currentUser
    });
});

router.delete('/:placeId/comments/:commentId', async (req, res) => {
    let placeId = Number(req.params.placeId);
    let commentId = Number(req.params.commentId);

    if (isNaN(placeId)) {
        return res.status(404).json({ message: `Invalid id "${placeId}"` });
    }
    if (isNaN(commentId)) {
        return res.status(404).json({ message: `Invalid id "${commentId}"` });
    }

    const comment = await Comment.findOne({
        where: { commentId: commentId, placeId: placeId }
    });

    if (!comment) {
        return res.status(404).json({ message: `Could not find comment` });
    }
    if (comment.authorId !== req.currentUser?.userId) {
        return res.status(403).json({ message: `You do not have permission to delete comment "${comment.commentId}"` });
    }

    await comment.destroy();
    res.json(comment);
});

module.exports = router;