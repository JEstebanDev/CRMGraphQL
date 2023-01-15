const typeDefs = require("./db/schema.graphql");
const resolvers = require("./db/resolvers.graphql");
const { ApolloServer } = require("apollo-server");
const connectDB = require("./config/db");
connectDB();

//server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => {
    const myContext = "Hi Juan";
    return { myContext };
  },
});

//start server
server.listen().then(({ url }) => {
  console.log(`Server running ${url}`);
});
