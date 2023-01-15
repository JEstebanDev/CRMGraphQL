const { gql } = require("apollo-server");
//schema
const typeDefs = gql`
  type User {
    id: ID
    name: String
    lastName: String
    email: String
    password: String
    createAt: String
  }

  type Token {
    token: String
  }

  input authUserInput {
    email: String!
    password: String!
  }

  input userInput {
    name: String!
    lastName: String!
    email: String!
    password: String!
  }

  type Query {
    getUserByToken(token: String!): User
  }

  type Mutation {
    newUser(input: userInput): User
    authenticUser(input: authUserInput): Token
  }
`;

module.exports = typeDefs;
