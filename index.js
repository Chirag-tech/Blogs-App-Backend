const express = require('express'),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    jwt = require('jsonwebtoken'),
    posts = require('./models/posts'),
    app = express(),
    env = require('dotenv').config(),
    cors = require('cors'),
    user = require('./models/user'),
    bcrypt = require('bcrypt'),
    PORT = 5000;


app.use(cors());
app.use(express.json());


mongoose.connect(env.parsed.DB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("connected to DB");
}).catch(err => {
    console.log("ERROR:" + err.message);
});


//signup
app.post('/signup', async(req, res) => {

    user.findOne({ username: req.body.username }, async (err, data) => {

        if (err)
            res.status(404).send({message:'Something Went Wrong,Please try again later'});
        else if (data)
            res.status(400).send({message:'username already exists'});
        else {
            let newUser = new user({ username: req.body.username, password: req.body.password });
            const salt = await bcrypt.genSalt(10);
            newUser.password = await bcrypt.hash(req.body.password, salt);
            await newUser.save();
            const token = jwt.sign({
                username: req.body.username,
            }, 'secretKey',{expiresIn:60*10});
            res.send({
                Message: "Successfully registered",
                id:newUser.id,
                username: newUser.username,
                token
            })
        }
    })
    
    
})

//login
app.post('/login', (req, res) => {
    user.findOne({ username: req.body.username },async(err,user) => {
        if (err) {
            res.status(404).send({message:'Something Went Wrong,Please try again later'});
        } else {
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (isMatch) {
                const token = jwt.sign({
                    username: req.body.username,
                }, 'secretKey',{expiresIn:60*10});
            
                res.send({
                    message:"Success",
                    token,
                    id: user.id,
                    username: req.body.username
                })
            } else {
                res.status(400).send({message:'Username or Password is incorrect'});
            }
        }
    })
})

//get all posts 
app.get('/getPosts', (req, res) => {


    posts.find({}, (err, posts) => {
        if (err)
            res.status(404).send({message:'Something Went Wrong,Please try again later'});
        else
            res.send({
                posts
            });
    })


})

//getUser posts
app.get('/getUserPosts/:id', (req, res) => {
    posts.find({ 'author.id' : req.params.id }, (err, posts) => {
        if (err)
            res.status(404).send({message:'Something Went Wrong,Please try again later'});
        else
            res.send({ posts });
    })
})

//get single post
app.get('/getPost/:id', (req, res) => {
    posts.findById(req.params.id, (err, post) => {
        if (err)
            res.status(404).send({message:'Something Went Wrong,Please try again later'});
        else
            res.send(post);
    })
})

//create new post
app.post("/createPost", VerifyToken, (req, res) => {
    jwt.verify(req.token, 'secretKey', (err, authData) => {
        if (err)
             res.status(403).send({message:'Unauthorized'});
        else {
            if (req.body.postBody) {

                if (req.body.postBody.length > 10000) {
                    return res.status(400).send({message:'Character Limited of 10,000 Exceeded'})
                }
                const data = {
                    title:req.body.title,
                    postBody: req.body.postBody,
                    author:req.body.author,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }
                posts.create(data, (error, result) => {
                    if (error)
                        res.status(404).send({message:'Something Went Wrong,Please try again later'});
                    res.send({
                        data: result
                    })
                })
            } else {
                res.send({
                    Message: "PostBody is required"
                });
            }
        }
    })
})

//update post 
app.put('/updatePost/:id', VerifyToken, (req, res) => {

    jwt.verify(req.token, 'secretKey', (err, result) => {
        if (err)
            res.status(403).send({message:'Unauthorized'});
        else {
            if (req.body.postBody.length > 10000) {
               return res.status(400).send({message:'Character Limited of 10,000 Exceeded'})
            }
            const data = {
                ...req.body,
                updatedAt: Date.now()
            }
            
            posts.findByIdAndUpdate(req.params.id, data, (error, response) => {
                if (error)
                    res.status(404).send({message:'Something Went Wrong,Please try again later'});

                res.send({
                    status: "Success"
                })
            })
        }
    })

})

//delete route 
app.delete('/deletePost/:id', VerifyToken, (req, res) => {
    jwt.verify(req.token, 'secretKey', (err, result) => {
        if (err)
            res.status(403).send({message:'Unauthorized'});
        else {
            posts.findByIdAndRemove(req.params.id, (error, response) => {
                if (error)
                    res.status(404).send({message:'Something Went Wrong,Please try again later'});
                res.send({
                    status: "Success"
                })
            })
        }
    })

})


//middleware
function VerifyToken(req, res, next) {

    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.status(403).send({message:'Unauthorized'});
    }
}

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
})