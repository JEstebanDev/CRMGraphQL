const user = require("../models/user");
const product = require("../models/product");
const client = require("../models/client");
const order = require("../models/order");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
//Resolvers
const resolvers = {
  Query: {
    getUserByToken: async (_, { token }) => {
      const { email } = jwt.decode(token);
      const userData = user.findOne({ email });
      return userData;
    },
    getAllProducts: async () => {
      try {
        return product.find({});
      } catch (error) {
        throw new Error(error);
      }
    },
    getProductById: async (_, { ID }) => {
      const productExist = await product.findById(ID);
      if (!productExist) throw new Error("No exist product with ID" + ID);
      return productExist;
    },
    getAllClients: async () => {
      try {
        return client.find({});
      } catch (error) {
        throw new Error(error);
      }
    },
    getClientBySeller: async (_, {}, ctx) => {
      const {
        user: { id },
      } = ctx;
      return client.find({ seller: id.toString() });
    },
    getClientById: async (_, { ID }) => {
      const clientExist = await client.findById(ID);
      if (!clientExist) throw new Error("No exist client with ID" + ID);
      return clientExist;
    },
  },
  Mutation: {
    newUser: async (_, { input }) => {
      const { email, password } = input;
      //Check user
      const existUser = await user.findOne({ email });
      if (existUser) throw new Error("User already exist");
      //Hash password
      const salt = bcryptjs.genSaltSync(10);
      input.password = bcryptjs.hashSync(password, salt);

      try {
        //Save in DB
        const newUser = new user(input);
        newUser.save();
        return newUser;
      } catch (error) {
        throw new Error(error);
      }
    },
    authenticUser: async (_, { input }) => {
      const { email, password } = input;

      //user exist
      const existUser = await user.findOne({ email });
      if (!existUser) throw new Error(`The user with email: ${email} no exist`);

      //password is correct
      const isCorrectPassword = await bcryptjs.compare(
        password,
        existUser.password
      );
      if (!isCorrectPassword) throw new Error("Error password incorrect");

      //create token
      return {
        token: createToken(existUser, process.env.TOKEN, "24h"),
      };
    },
    newProduct: async (_, { input }) => {
      const { name } = input;
      //check Product
      const existProduct = await product.findOne({ name });
      if (existProduct) throw Error("Product already exist");

      try {
        const newProduct = new product(input);
        newProduct.save();
        return newProduct;
      } catch (error) {
        throw new Error(error);
      }
    },
    updateProduct: async (_, { id, input }) => {
      //check Product
      let existProduct = await product.findById(id);
      if (!existProduct) throw Error("Product already exist");

      existProduct = product.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return existProduct;
    },
    deleteProductById: async (_, { id }) => {
      const existProduct = product.findById(id);
      if (!existProduct) throw new Error("No exist product with ID:" + id);
      await product.findOneAndDelete({ _id: id });
      return `Product with ID:${id} deleted`;
    },
    newClient: async (_, { input }, ctx) => {
      const {
        user: { id },
      } = ctx;
      const { email } = input;
      //Check Client
      const existClient = client.findOne({ email });
      if (!existClient)
        throw new Error("Client already exist with email:" + email);

      try {
        const newClient = new client(input);
        newClient.seller = id;
        newClient.save();
        return newClient;
      } catch (error) {
        new Error(error);
      }
    },
    updateClient: async (_, { id, input }, ctx) => {
      const { user } = ctx;
      let updateClient = input;
      updateClient.seller = user.id;
      let existClient = await checkClient(id, ctx.user.id);

      existClient = client.findOneAndUpdate({ _id: id }, updateClient, {
        new: true,
      });
      return existClient;
    },
    deleteClientById: async (_, { id }, ctx) => {
      const existClient = await client.findById(id);
      if (!existClient) throw new Error("No exist client with ID:" + id);
      if (existClient.seller.toString() !== ctx.user.id)
        throw new Error("Does not have the credentials");
      //await client.findOneAndDelete({ _id: id });
      return `Client with ID:${id} deleted`;
    },
    newOrder: async (_, { input }, ctx) => {
      const {
        user: { id },
      } = ctx;
      const { client: clientID, product } = input;
      //checkCLient
      const existClient = await client.findById(clientID);
      if (!existClient) throw new Error("The client does not exist " + client);
      if (existClient.seller.toString() !== id)
        throw new Error("Does not have the credentials");
      //check product stock
      await checkStock(product);
      //create new order
      const newOrder = new order(input);
      //set seller
      newOrder.seller = id;
      //save data
      newOrder.save();
      return newOrder;
    },
    updateOrder: async (_, { id, input }, ctx) => {
      const { client, product } = input;
      let updateOrder = input;
      //check order
      let orderData = await checkOrder(id);
      //check client
      const { id: idClient } = await checkClient(client, ctx.user.id);
      //set client
      updateOrder.client = idClient;
      //check product stock
      await checkStock(product);
      //update data
      orderData = order.findOneAndUpdate({ _id: id }, updateOrder, {
        new: true,
      });
      //return value
      return orderData;
    },
  },
};

const createToken = (user, secretWord, expiresIn) => {
  const { id, name, lastName, email } = user;
  return jwt.sign({ id, name, lastName, email }, secretWord, { expiresIn });
};

const checkStock = async (listProduct) => {
  for await (const productItem of listProduct) {
    const { id, quantity } = productItem;
    const productData = await product.findById(id);
    if (!productData) throw new Error(`The product: ${id} does not exist`);
    if (quantity > productData.amount) {
      throw new Error(
        `The product: ${productData.name} exceeds the available quantity`
      );
    }
  }
};
const checkOrder = async (orderID) => {
  const orderData = await order.findById(orderID);
  if (!orderData) throw new Error(`The OrderID: ${orderID} does not exist}`);
  return orderData;
};

const checkClient = async (clientID, ctxId) => {
  const clientData = await client.findById(clientID);
  if (!clientData) throw new Error(`The clientID: ${clientID} does not exist}`);
  if (clientData.seller.toString() !== ctxId)
    throw new Error("Does not have the credentials");

  return clientData;
};

module.exports = resolvers;
