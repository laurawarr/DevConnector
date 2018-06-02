const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Post model
const Post = require('../../models/Post');
// Profile model
const Profile = require('../../models/Profile');

// Validation
const validatePostsInput = require('../../validation/post');

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get('/', (req, res) => {
    Post.find()
        .sort({ date: -1 })
        .then(posts => res.json(posts))
        .catch(err => res.status(404).json({ nopostsfound: 'No posts found' }))
})

// @route   GET api/posts/:id
// @desc    Get post by id
// @access  Public
router.get('/:id', (req, res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(err => res.status(404).json({ nopostfound: 'No post found with that id' }))
})

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
    const {errors, isValid } = validatePostsInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save().then(post => res.json(post))
})

// @route   DELETE api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
               .then(post => {
                    // Check post owner
                    if (post.user.toString() !== req.user.id) {
                        return res.status(401).json({ notauthorized: 'User not authorized.'});
                    }

                    // Delete
                    post.remove()
                        .then(() => res.json({ success: true }))
                        .catch(err => res.status(404).json({ postnotfound: 'Post not found with this id'}))
               })
        })
})

// @route   POST api/posts/like/:id
// @desc    Like a post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
               .then(post => {
                    if (post.likes.filter(like => like.user.toString() === req.user.id).length) {
                        return res.status(400).json({ alreadyliked: 'User already liked this post' })
                    }
                    // Add user to likes array
                    post.likes.unshift({ user: req.user.id })

                    // Save post
                    post.save().then(post => res.json(post))
               })
        })
})

// @route   POST api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
               .then(post => {
                    if (!post.likes.filter(like => like.user.toString() === req.user.id).length) {
                        return res.status(400).json({ notliked: 'User has not yet liked this post' })
                    }
                    // Get remove index
                    const removeIndex = post.likes.map(item => item.user.toString()).indexOf(req.params.id)
                    post.likes.splice(removeIndex, 1);

                    // Save post
                    post.save().then(post => res.json(post))
               })
        })
})

// @route   POST api/posts/comment/:id
// @desc    Add comment to a post
// @access  Private
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
    const {errors, isValid } = validatePostsInput(req.body);

    // Check validation
    if (!isValid) {
        return res.status(400).json(errors)
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    const newComment = {
                        text: req.body.text,
                        name: req.body.name,
                        avatar: req.body.avatar,
                        user: req.user.id
                    }

                    // Add user to comments array
                    post.comments.unshift(newComment)

                    // Save post
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ postnotfound: 'No post found.' }))
        })
})

// @route   DELETE api/posts/comment/:id/:comment_id
// @desc    Remove comment from a post
// @access  Private
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
    Profile.findOne({ user: req.user.id })
        .then(profile => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check if comment exists
                    if (!post.comments.filter(comment => comment._id.toString() === req.params.comment_id).length) {
                        return res.status(404).json({ comentnotexisits: 'Comment does not exist.' })
                    }

                    // Get remove index
                    const removeIndex = post.comments
                        .map(comment => comment._id.toString())
                        .indexOf(req.params.comment_id)
                    
                    // Remove from comments array
                    post.comments.splice(removeIndex, 1)

                    // Save post
                    post.save().then(post => res.json(post))
                })
                .catch(err => res.status(404).json({ postnotfound: 'No post found.' }))
        })
})

module.exports = router;