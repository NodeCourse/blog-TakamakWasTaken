const Sequelize = require('sequelize');
const express = require('express');
const app = express();

const db = new Sequelize('blognode', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
const User = db.define('user', {
    fullname: { type: Sequelize.STRING },
    email: { type: Sequelize.STRING }
});
const Post = db.define('post', {
    title: { type: Sequelize.STRING }
});

const Vote = db.define('vote', {
    action: {
        type: Sequelize.ENUM('up', 'down') //liste les différentes valeurs possibles.
    }
});
Post.hasMany(Vote);
Vote.belongsTo(Post);
Post.belongsTo(User);
User.hasMany(Post);

app.post('/api/post/:postId/downvote', (req, res) => {
    Vote
        .create({action: 'down', postId: req.params.postId})
        .then(() => res.redirect('/'));
});

function createUser() {

    User
        .sync()
        .then(() => {
            User.create({
                fullname: 'Jane Doe',
                email: 'jane.doe@gmail.com'
            });
        })
        .then(() => {
            User.create({
                fullname: 'John Doe',
                email: 'john.doe@gmail.com'
            });
        })
        .then(() => {
            return User.findAll();
        })
        .then((users) => {
            console.log(users);
        });

        /*
        .then(() => {
            return User.findAll();
        })
        .then((users) => {
            console.log(users);
        });*/
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
    app.post('/api/post/:postId/upvote', (req, res) => {
        Vote
            .create({action: 'up', postId: req.params.postId})
            .then(() => res.redirect('/'));
    });
createUser();
createPost();
Vote
    .sync();

/**/

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
    Post
        .findAll(/*{ include: [Vote] }*/)
        .then(posts => res.render('homepage', { posts }));

});


app.listen(3000, () => {
    console.log('Listening on port 3000');
});
