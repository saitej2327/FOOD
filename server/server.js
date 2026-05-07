require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const app = express();
const connectDB = require("./config/db");
const Food = require("./models/Food");
const Order = require("./models/Order");
const User = require("./models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to database
connectDB();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

app.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Signup successful", token, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful", token, email: user.email, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/add-food", async (req, res) => {
  try {
    const { name, price, image, category } = req.body;
    if (!name || !price || !image) {
      return res.status(400).json({ error: "Name, price, and image are required" });
    }

    const newFood = new Food({ name, price, image, category });
    await newFood.save();

    res.json({ message: "Food added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/menu", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category && category !== "all" ? { category } : {};
    const foods = await Food.find(filter).sort({ name: 1 });
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/orders", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart must contain at least one item" });
    }

    const orderItems = items.map((item) => ({
      foodId: item.foodId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = new Order({ user: req.userId, items: orderItems, total });
    await order.save();

    res.json({ message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});