const Sequelize = require('sequelize');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const COOKIE_SECRET = 'cookie secret';


const db = new Sequelize('blognode', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
const User = db.define('user', {
    firstname: { type: Sequelize.STRING },
    lastname: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING },
    password: { type: Sequelize.STRING }
});

const Comment = db.define('comment', {
    content: { type: Sequelize.STRING }
});

const Post = db.define('post', {
    title: { type: Sequelize.STRING }
},
    {
        getterMethods: {
            score(){
                let total = 0;
                for(let i = 0; i< this.votes.length; i++){
                    if(this.votes[i].action === 'up'){
                        total += 1;
                    }
                    else{
                        total = total - 1;
                    }
                }
                return total;
            }
        }
    }
);

const Vote = db.define('vote', {
    action: {
        type: Sequelize.ENUM('up', 'down') //liste les différentes valeurs possibles.
    }
});
Post.hasMany(Vote);
Vote.belongsTo(Post);
Post.belongsTo(User);
User.hasMany(Post);
Comment.belongsTo(User);
User.hasMany(Comment);


function createUser() {

    User
        .sync()
        /*.then(() => {
            User.create({
                firstname: 'Jane',
                lastname: 'Doe',
                email: 'jane.doe@gmail.com',
                password: '123'
            });
        })
        .then(() => {
            User.create({
                firstname: 'Jane',
                lastname: 'Doe',
                email: 'john.doe@gmail.com',
                password: '321'
            });
        })*/
        .then(() => {
            return User.findAll();
        })
        .then((users) => {
            console.log(users);
        });
}

function createPost(){
    Post
        .sync()
        .then(() => {
            Post.create({
                title: 'News de Sbire1'
            });
        })
        .then(() => {
            Post.create({
                title: 'Sbire2 no post'
            })
        });
}

const app = express();

app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
//----------------Authentification------------------

//--------------------------------------------------

//---------------Création utilisateurs--------------

app.get('/api/signUp', (req, res) => {
    res.render('signUp');
})

app.post('/api/signUp', (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    if()
    User
        .create({
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: password
        })
        .then(() => {
            res.redirect('/');
        })
        .catch((error) =>{
            res.render('500', {error: error})
        });
});

//--------------------------------------------------


app.post('/api/post/:postId/upvote', (req, res) => {
    Vote
        .create({action: 'up', postId: req.params.postId})
        .then(() => res.redirect('/'));
});

app.post('/api/post/:postId/downvote', (req, res) => {
    Vote
        .create({action: 'down', postId: req.params.postId})
        .then(() => res.redirect('/'));
});


app.get('/', (req, res) => {
    Post
        .findAll({ include: [Vote] })
        .then(posts => res.render('homepage', { posts }));

});

app.post('/api/post', (req, res) => {
    const title = req.body.title;
    Post
        .create({ title: title })
        .then(() => {
        res.redirect('/');
        })
    .catch((error) =>{
        res.render('500', {error: error})
    });
});


db
    .sync()
    .then(() =>{
        app.listen(3000, () => {
            console.log('Listening on port 3000');
        });
    });

/*app.listen(3000, () => {
    console.log('Listening on port 3000');
});*/
