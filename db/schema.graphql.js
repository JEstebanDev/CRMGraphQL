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

  #---------------------

  type Product {
    id: ID
    name: String
    amount: Int
    price: Float
    createAt: String
  }

  input productInput {
    name: String!
    amount: Int!
    price: Float!
  }

  #---------------------

  type Client {
    id: ID
    name: String
    lastName: String
    company: String
    email: String
    phone: String
    seller: ID
  }

  input clientInput {
    name: String!
    lastName: String!
    company: String!
    email: String!
    phone: String
  }
  #---------------------

  type Order {
    id: ID
    product: [orderGroup]
    total: Float
    client: ID
    seller: ID
    status: statusOrder
    createAt: String
  }

  type orderGroup {
    id: ID
    quantity: Int
  }

  input orderProductInput {
    id: ID
    quantity: Int
  }

  input orderInput {
    product: [orderProductInput]!
    total: Float!
    client: ID!
    status: statusOrder!
  }

  enum statusOrder {
    PENDING
    COMPLETED
    CANCELLED
  }
  #---------------------

  type TopClient {
    total: Float
    client: [Client]
  }
  type TopSeller {
    total: Float
    seller: [User]
  }

  #---------------------
  type Query {
    #User
    getUserByToken(token: String!): User

    #Product
    getAllProducts: [Product]
    getProductById(ID: ID!): Product

    #Client
    getAllClients: [Client]
    getClientBySeller: [Client]
    getClientById(ID: ID!): Client

    #Order
    getAllOrders: [Order]
    getOrderBySeller: [Order]
    getOrderById(ID: ID!): Order
    getOrderByStatus(status: String!): [Order]

    #AdvanceQuery
    getTopClient: [TopClient]
    getTopSeller: [TopSeller]
    getProductByName(name: String!): [Product]
  }

  type Mutation {
    #User
    newUser(input: userInput): User
    authenticUser(input: authUserInput): Token

    #Product
    newProduct(input: productInput): Product
    updateProduct(id: ID!, input: productInput): Product
    deleteProductById(id: ID!): String

    #Client
    newClient(input: clientInput): Client
    updateClient(id: ID!, input: clientInput): Client
    deleteClientById(id: ID!): String

    #Order
    newOrder(input: orderInput): Order
    updateOrder(id: ID!, input: orderInput): Order
    deleteOrder(id: ID!): String
  }
`;

module.exports = typeDefs;
