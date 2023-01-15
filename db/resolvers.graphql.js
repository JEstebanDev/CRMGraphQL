const user = require("../models/user");
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
        console.error(error);
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
  },
};

const createToken = (user, secretWord, expiresIn) => {
  const { id, name, lastName, email } = user;
  return jwt.sign({ id, name, lastName, email }, secretWord, { expiresIn });
};

module.exports = resolvers;
