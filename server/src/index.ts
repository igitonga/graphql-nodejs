import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from '@apollo/server/standalone';
import { MongoClient, ObjectId } from "mongodb";
import 'dotenv/config'
import { typeDefs } from "./schema.js";


const client = new MongoClient(process.env.MONGODB_URL);
let db = null;

try {
    await client.connect();
    console.log('Connected to database');

    db = client.db(process.env.DB_NAME);
} catch (error) {
    console.error(`Database connection error: ${error}`);
}

const gamesCollection = db.collection('games');
const authorsCollection = db.collection('authors');
const reviewsCollection = db.collection('reviews');

const resolvers = {
    Query: {
        async games() { 
            const allGames = await gamesCollection.find({}).toArray();

            return allGames;
        },
        async game(_, args) {
            const game = await gamesCollection.findOne({ _id: new ObjectId(args.id) }); 
            
            return game;
        },
        async authors() {
            const allAuthors = await authorsCollection.find({}).toArray();

            return allAuthors;
        },
        async author(_, args) {
            const author = await authorsCollection.findOne({ _id: new ObjectId(args.id) }); 

            return author;
        },
        async reviews() {
            const allReviews = await reviewsCollection.find({}).toArray();

            return allReviews;
        },
        async review(_, args) {
            const review = await reviewsCollection.findOne({ _id: new ObjectId(args.id) }); 

            return review;
        }
    },
    Game: {
        reviews(parent) {
            return reviewsCollection.find({game_id: parent._id.toString()}).toArray();
        }
    },
    Author: {
        reviews(parent) {
            return reviewsCollection.find({author_id: parent._id.toString()}).toArray();
        }
    },
    Review : {
        author(parent) {
            return authorsCollection.findOne({_id: new ObjectId(parent.author_id)});
        },
        game(parent) {
            return gamesCollection.findOne({_id: new ObjectId(parent.game_id)});
        }
    },
    Mutation: {
        async addGame(_, args) {
            let newGame = {...args.game};
            await gamesCollection.insertOne(newGame);

            return newGame;
        },
        async deleteGame(_, args) {
            let deleteGame = await gamesCollection.deleteOne({_id: new ObjectId(args.id)});

            return deleteGame;
        },
        async updateGame(_, args) {
            let game = await gamesCollection.updateOne({_id: new ObjectId(args.id)},{$set: {...args.game}});

            return game;
        },

        async addAuthor(_, args) {
            let newAuthor = {...args.author}
            await authorsCollection.insertOne(newAuthor);

            return newAuthor;
        },
        async updateAuthor(_, args) {
            let author = await authorsCollection.updateOne({_id: new ObjectId(args.id)}, {$set: {...args.author}});

            return author;
        },
        async deleteAuthor(_, args) {
            let author = await authorsCollection.deleteOne({_id: new ObjectId(args.id)})

            return author;
        },

        async addReview(_, args) {
            let newReview = {...args.review};
            await reviewsCollection.insertOne(newReview);

            return newReview;
        },
        async updateReview(_, args) {
            let review = await reviewsCollection.updateOne({_id: new ObjectId(args.id)}, {$set: {...args.review}});

            return review;
        },
        async deleteReview(_, args) {
            let review = await reviewsCollection.deleteOne({_id: new ObjectId(args.id)})

            return review;
        },        
    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
});

console.log(`Server ready at: ${url}`)
  