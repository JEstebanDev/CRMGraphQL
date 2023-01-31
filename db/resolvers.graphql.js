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
    getUserByToken: async (_, {}, ctx) => {
      const userData = user.findOne({ email: ctx.user.email });
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
    getAllOrders: async () => {
      try {
        return order.find({});
      } catch (error) {
        throw new Error(error);
      }
    },
    getOrderBySeller: async (_, {}, ctx) => {
      try {
        const listOrderBySeller = await order.find({ seller: ctx.user.id });
        if (!listOrderBySeller)
          throw new Error("No exist seller with ID" + ctx.user.id);
        return listOrderBySeller;
      } catch (error) {
        throw new Error(error);
      }
    },
    getOrderById: async (_, { ID }, ctx) => {
      const orderById = await order.findById(ID);
      //check seller
      await checkSeller(orderById.seller, ctx.user.id);

      return orderById;
    },
    getOrderByStatus: async (_, { status }) => {
      try {
        const listOrder = await order.find({ status });
        return listOrder;
      } catch (error) {
        throw new Error(error);
      }
    },
    getTopClient: async (_, {}) => {
      const getAllClients = await order.aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: "$client",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clients",
            localField: "_id",
            foreignField: "_id",
            as: "client",
          },
        },
      ]);
      return getAllClients;
    },
    getTopSeller: async (_, {}) => {
      const getAllClients = await order.aggregate([
        { $match: { status: "COMPLETED" } },
        {
          $group: {
            _id: "$seller",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
      ]);
      return getAllClients;
    },
    getProductByName: async (_, { name }) => {
      //text is the index's name in the models file
      const getProductByName = await product.find({
        $text: { $search: name },
      });
      return getProductByName;
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
      const existClient = await client.findOne({ email });
      if (existClient != null)
        throw new Error("Client already exist with email:" + email);

      try {
        const newClient = new client(input);
        newClient.seller = id;
        const result = await newClient.save();
        return result;
      } catch (error) {
        throw new Error(error);
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
      await client.findOneAndDelete({ _id: id });
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
    deleteOrder: async (_, { id }) => {
      await checkOrder(id);
      await order.findOneAndRemove({ _id: id });
      return `The order with id ${id} was deleted`;
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

const checkSeller = async (sellerID, ctxId) => {
  const sellerData = await user.findById(sellerID);
  if (!sellerData) throw new Error(`The sellerID: ${sellerID} does not exist}`);
  if (sellerData.id.toString() !== ctxId)
    throw new Error("Does not have the credentials");

  return sellerData;
};

module.exports = resolvers;
