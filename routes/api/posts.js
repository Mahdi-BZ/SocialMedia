const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load model
const Post = require("../../models/Post");

// Load validation
const validatePostInput = require("../../validation/post");

// @route POST /api/posts
// @desc Create post
// @access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);

    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });

    newPost.save().then(post => res.json(post));
  }
);

// @route GET /api/posts
// @desc Get all posts
// @access Public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ post: "No posts found" }));
});

// @route GET /api/posts/:post_id
// @desc Get post by id
// @access Public
router.get("/:post_id", (req, res) => {
  Post.findById(req.params.post_id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ post: "No post found" }));
});

// @route DELETE /api/posts/:post_id
// @desc Delete post by id
// @access Public
router.delete(
  "/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id)
      .then(post => {
        // Check for post owner
        if (post.user.toString() !== req.user.id) {
          return res
            .status(401)
            .json({ unAuthorized: "You are not allowed to delete this post" });
        }

        // Delete
        post.remove().then(() => res.json({ success: true }));
      })
      .catch(err => res.status(404).json({ post: "Post not found" }));
  }
);

// @route POST /api/like/:post_id
// @desc Like post by id
// @access Private
router.post(
  "/like/:post_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.post_id).then(post => {
      if (
        post.likes.filter(like => like.user.toString() === req.user.id).length >
        0
      ) {
        return res
          .status(400)
          .json({ alreadyliked: "User already liked this post" });
      }

      // Add user id to likes
      post.like.unshift({ user: req.user.id });
      post
        .save()
        .then(post => res.json({ post }))
        .catch(err => res.json(err));
    });
  }
);

module.exports = router;
