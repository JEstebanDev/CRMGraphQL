const typeDefs = require("./db/schema.graphql");
const resolvers = require("./db/resolvers.graphql");
const jwt = require("jsonwebtoken");

const { ApolloServer } = require("apollo-server");
const connectDB = require("./config/db");

require("dotenv").config({ path: ".env" });

connectDB();

//server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        const user = jwt.verify(token, process.env.TOKEN);
        return { user };
      } catch (error) {
        console.error(error);
      }
    }
  },
});

//start server
server.listen().then(({ url }) => {
  console.log(`Server running ${url}`);
});
