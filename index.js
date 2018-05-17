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
        });
}

const app = express();

app.set('view engine', 'pug');
app.use(cookieParser(COOKIE_SECRET));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialize passport, it must come after Express' session() middleware
app.use(passport.initialize());
app.use(passport.session());

//----------------Authentification------------------

passport.use(new LocalStrategy((email, password, cb) => {

    // Find a user with the provided username (which is an email address in our case)
    User
        .findOne({ where: {
                email, password
            }
        })
        .then(user => {
            if(user){
                return cb(null, user);
            }
            else{
                return cb(null, false, {
                    error: "email ou mot de passe inconnu."
                });
            }
        });
}));

// Save the user's email address in the cookie
passport.serializeUser((user, cb) => {
    cb(null, user.email);
});

passport.deserializeUser((username, cb) => {
    // Fetch the user record corresponding to the provided email address
    User
        .findOne({ where: {
            email: username
        }})

        .then((user) =>{
            cb(null, user);
        })
});
//-----------------------Authentification Fin---------------------------

//---------------Création utilisateurs--------------

app.get('/api/signUp', (req, res) => {
    res.render('signUp');
})

app.post('/api/signUp', (req, res) => {
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    if(firstname != null && lastname != null && email != null && password != null){
        User
            .create({
                firstname: firstname,
                lastname: lastname,
                email: email,
                password: password
            })
            .then((user) => {
            req.login(user, () => {
                res.redirect('/');
                });
            })
            .catch((error) =>{
                res.render('500', {error: error})
            });
    }
    else{
        console.log("L'utilisateur n'a pas pu être créé.")
    }
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
        .then(posts => res.render('homepage', { posts, user: req.user }));

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

app.get('/api/login', (req, res) => {
    // Render the login page
    res.render('login');
});

app.post('/api/login',
    // Authenticate user when the login form is submitted
    passport.authenticate('local', {
        // If authentication succeeded, redirect to the home page
        successRedirect: '/',
        // If authentication failed, redirect to the login page
        failureRedirect: '/api/login'
    })
);

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
