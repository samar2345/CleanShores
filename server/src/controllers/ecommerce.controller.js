// server/src/controllers/ecommerce.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Product } from "../models/Product.js"; // Import Product model
import { Order } from "../models/Order.js";     // Import Order model
import { User } from "../models/User.js";       // Import User model (for gamification, roles)
import mongoose from 'mongoose'; // For ObjectId
import { z } from 'zod'; // For validation
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"; // For product image upload

// Zod Schemas for validation
// const createProductSchema = z.object({
//   name: z.string().trim().min(3, "Product name must be at least 3 characters"),
//   description: z.string().trim().min(10, "Description must be at least 10 characters"),
//   price: z.number().min(0, "Price cannot be negative"),
//   stock: z.number().int().min(0, "Stock cannot be negative").default(0),
//   category: z.string().trim().optional().default('General'),
//   isAvailable: z.boolean().optional().default(true),
// });

// const updateProductSchema = z.object({
//   name: z.string().trim().min(3).optional(),
//   description: z.string().trim().min(10).optional(),
//   price: z.number().min(0).optional(),
//   stock: z.number().int().min(0).optional(),
//   category: z.string().trim().optional(),
//   isAvailable: z.boolean().optional(),
// });
// Zod Schemas for validation
const createProductSchema = z.object({
  name: z.string().trim().min(3, "Product name must be at least 3 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  price: z.number().min(0, "Price cannot be negative"),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
  category: z.string().trim().optional().default('General'),
  isAvailable: z.boolean().optional().default(true),
});

// Also double-check updateProductSchema similarly
const updateProductSchema = z.object({
  name: z.string().trim().min(3).optional(),
  description: z.string().trim().min(10).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().trim().optional(),
  isAvailable: z.boolean().optional(),
});

const placeOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), "Invalid productId format"),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
  })).min(1, "Order must contain at least one item"),
  shippingAddress: z.object({
    street: z.string().trim().min(5, "Street is required"),
    city: z.string().trim().min(2, "City is required"),
    state: z.string().trim().min(2, "State is required"),
    pincode: z.string().trim().regex(/^\d{6}$/, "Pincode must be 6 digits"), // Assuming Indian pincode
    contactNumber: z.string().trim().regex(/^\+?\d{10,15}$/, "Invalid contact number format"), // Basic phone number regex
  }),
});

const updateOrderStatusSchema = z.object({
    orderStatus: z.enum(['pending_review', 'confirmed', 'awaiting_pickup_delivery', 'fulfilled', 'cancelled']),
    notesFromNGO: z.string().trim().optional(),
});

// @desc    NGO adds a new product
// @route   POST /api/v1/ecommerce/products
// @access  Protected (NGO only)
const addProduct = asyncHandler(async (req, res) => {
  // Convert fields to correct types for Zod validation (for multipart/form-data)
  const body = {
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
    isAvailable: req.body.isAvailable !== undefined ? (req.body.isAvailable === 'true' || req.body.isAvailable === true) : undefined,
  };
  const { success, data, error } = createProductSchema.safeParse(body);
  if (!success) {
    const message =
      error?.errors?.[0]?.message ||
      "Invalid product data. Please check your input.";
    throw new ApiError(400, message);
  }

  const { name, description, price, stock, category, isAvailable } = data;

  // Handle product image upload (assuming single file for simplicity here)
//   const productImageUrlLocalPath = req.file?.path;
//   if (!productImageUrlLocalPath) {
//     throw new ApiError(400, 'Product image file is required');
//   }

//   const imageUrl = await uploadOnCloudinary(productImageUrlLocalPath);
//   if (!imageUrl || !imageUrl.url) {
//     throw new ApiError(500, 'Failed to upload product image to Cloudinary');
//   }
  console.log('--- Controller: addProduct ---');
  console.log('req.body (text fields):', req.body);
  console.log('req.file (from upload.single):', req.file); // <-- The crucial log for this route

  const productImageUrlLocalPath = req.file?.path;
  console.log('productImageUrlLocalPath (extracted):', productImageUrlLocalPath);

  if (!productImageUrlLocalPath) {
    console.error("DEBUG ERROR: addProduct - productImageUrlLocalPath is UNDEFINED or NULL. Throwing API Error.");
    throw new ApiError(400, 'Product image file is required');
  }

  const imageUrl = await uploadOnCloudinary(productImageUrlLocalPath);
  if (!imageUrl || !imageUrl.url) {
    console.error("DEBUG ERROR: addProduct - Cloudinary upload failed for productImage.");
    throw new ApiError(500, 'Failed to upload product image to Cloudinary');
  }

  // Check if product with this name already exists
  const existingProduct = await Product.findOne({ name });
  if (existingProduct) {
    throw new ApiError(409, "Product with this name already exists.");
  }

  const product = await Product.create({
    name,
    description,
    price,
    stock,
    category,
    isAvailable,
    imageUrl: imageUrl.url,
    createdBy: req.user._id, // Set the NGO user as creator
  });

  if (!product) {
    throw new ApiError(500, "Failed to add product.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Product added successfully!"));
});

// @desc    Get all products (publicly visible)
// @route   GET /api/v1/ecommerce/products
// @access  Public
const getAllProducts = asyncHandler(async (req, res) => {
  const { category, search } = req.query;
  const filter = { isAvailable: true }; // Only show available products by default

  if (category) {
    filter.category = category;
  }
  if (search) {
    filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search by name
  }

  const products = await Product.find(filter);

  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products fetched successfully!"));
});

// @desc    Get a single product by ID
// @route   GET /api/v1/ecommerce/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product || !product.isAvailable) { // Also check if product is available
    throw new ApiError(404, "Product not found or not available.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully!"));
});

// @desc    NGO updates a product
// @route   PUT /api/v1/ecommerce/products/:id
// @access  Protected (NGO only)
const updateProduct = asyncHandler(async (req, res) => {
  // Convert fields to correct types for Zod validation (for multipart/form-data)
  const body = {
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : undefined,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
    isAvailable: req.body.isAvailable !== undefined ? (req.body.isAvailable === 'true' || req.body.isAvailable === true) : undefined,
  };
  const { success, data, error } = updateProductSchema.safeParse(body);
  if (!success) {
    const message =
      error?.errors?.[0]?.message ||
      "Invalid product data. Please check your input.";
    throw new ApiError(400, message);
  }

  const productId = req.params.id;
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  // Ensure only the creator NGO can update
  if (product.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this product.");
  }

  // Handle image update if a new file is uploaded
  if (req.file) {
      const newImageUrlLocalPath = req.file?.path;
      if (!newImageUrlLocalPath) { // Should not happen if multer passed, but defensive check
          throw new ApiError(400, 'New product image file is missing.');
      }
      const newImageUrl = await uploadOnCloudinary(newImageUrlLocalPath);
      if (!newImageUrl || !newImageUrl.url) {
          throw new ApiError(500, 'Failed to upload new product image to Cloudinary');
      }
      // Delete old image from Cloudinary (TODO: extract public ID from old product.imageUrl)
      // if (product.imageUrl) {
      //     const oldPublicId = extractPublicId(product.imageUrl); // Need a helper for this
      //     await deleteFromCloudinary(oldPublicId);
      // }
      product.imageUrl = newImageUrl.url;
  }

  // Update other fields
  Object.assign(product, data); // Merges validated data into product object

  const updatedProduct = await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully!"));
});

// @desc    NGO deletes a product
// @route   DELETE /api/v1/ecommerce/products/:id
// @access  Protected (NGO only)
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  // Ensure only the creator NGO can delete
  if (product.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this product.");
  }

  // Delete product image from Cloudinary
  // if (product.imageUrl) {
  //     const publicId = extractPublicId(product.imageUrl); // Need a helper for this
  //     await deleteFromCloudinary(publicId);
  // }

  await product.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully!"));
});

// @desc    User/Admin places an order
// @route   POST /api/v1/ecommerce/orders
// @access  Protected (User or Admin)
const placeOrder = asyncHandler(async (req, res) => {
  // Convert fields to correct types for Zod validation (for multipart/form-data)
  let body = req.body;
  if (typeof req.body.items === 'string') {
    try {
      body = { ...req.body, items: JSON.parse(req.body.items) };
    } catch (e) {
      throw new ApiError(400, 'Invalid items format. Must be a valid JSON array.');
    }
  }
  if (typeof req.body.shippingAddress === 'string') {
    try {
      body = { ...body, shippingAddress: JSON.parse(req.body.shippingAddress) };
    } catch (e) {
      throw new ApiError(400, 'Invalid shippingAddress format. Must be a valid JSON object.');
    }
  }
  const { success, data, error } = placeOrderSchema.safeParse(body);
  if (!success) {
    const message =
      error?.errors?.[0]?.message ||
      "Invalid order data. Please check your input.";
    throw new ApiError(400, message);
  }

  const { items, shippingAddress } = data;
  const userId = req.user._id;
  let totalAmount = 0;
  const orderItems = [];

  // Validate items and calculate total amount
  for (let item of items) {
    const product = await Product.findById(item.productId);

    if (!product || !product.isAvailable || product.stock < item.quantity) {
      throw new ApiError(400, `Product "${product?.name || item.productId}" is out of stock or not available for requested quantity.`);
    }

    totalAmount += product.price * item.quantity;
    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      priceAtOrder: product.price, // Store price at time of order
    });
  }

  // Create the order
  const order = await Order.create({
    userId,
    items: orderItems,
    totalAmount,
    shippingAddress,
    orderStatus: 'pending_review', // Initial status
    orderedAt: Date.now(),
  });

  if (!order) {
    throw new ApiError(500, "Failed to place order.");
  }

  // Important: Decrement stock only AFTER order is confirmed/fulfilled by NGO (manual flow)
  // For this basic flow, stock is decremented when NGO marks order as 'fulfilled'

  // Award gamification points for placing an order (optional, could be on fulfillment)
  // For now, let's add points upon successful order placement
  await User.findByIdAndUpdate(userId, { $inc: { gamificationPoints: totalAmount / 10 } }, { new: true }); // Example: 1 point per 10 units of currency

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully! NGO will contact you for fulfillment."));
});

// @desc    Get user's own orders
// @route   GET /api/v1/ecommerce/orders/my-orders
// @access  Protected (User or Admin)
const getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await Order.find({ userId })
    .populate('items.productId', 'name price imageUrl') // Populate product details in items
    .sort({ orderedAt: -1 }); // Latest orders first

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "My orders fetched successfully!"));
});

// @desc    NGO gets all orders
// @route   GET /api/v1/ecommerce/orders
// @access  Protected (NGO only)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, userId } = req.query; // Filter options

  const filter = {};
  if (status) {
    filter.orderStatus = status;
  }
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }

  const orders = await Order.find(filter)
    .populate('userId', 'fullName username email contactNumber') // Populate user details
    .populate('items.productId', 'name imageUrl') // Populate product details
    .sort({ orderedAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "All orders fetched successfully!"));
});

// @desc    NGO updates order status and notes
// @route   PATCH /api/v1/ecommerce/orders/:id/status
// @access  Protected (NGO only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  // Convert fields to correct types for Zod validation (for multipart/form-data)
  const body = {
    ...req.body,
    notesFromNGO: req.body.notesFromNGO !== undefined ? String(req.body.notesFromNGO) : undefined,
  };
  const { success, data, error } = updateOrderStatusSchema.safeParse(body);
  if (!success) {
    const message =
      error?.errors?.[0]?.message ||
      "Invalid order status data. Please check your input.";
    throw new ApiError(400, message);
  }
  const { orderStatus, notesFromNGO } = data;

  const orderId = req.params.id;
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  // Ensure only NGO can update status. If you want specific NGOs (e.g., who created products in order), add more checks.
  if (req.user.role !== 'ngo') {
    throw new ApiError(403, "Only NGO personnel can update order status.");
  }

  // Stock management and gamification on 'fulfilled'
  if (orderStatus === 'fulfilled' && order.orderStatus !== 'fulfilled') {
      for (const item of order.items) {
          await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: -item.quantity } }, // Decrement stock
              { new: true }
          );
      }
      // Gamification points (already awarded on placeOrder, so no double award here)
  }
  // If order is cancelled after stock was decremented (e.g., if you changed the logic), you'd re-increment stock here.
  // Currently, stock is only decremented on 'fulfilled', so no need to re-increment on cancel.

  order.orderStatus = orderStatus;
  if (notesFromNGO !== undefined) { // Allow clearing notes
      order.notesFromNGO = notesFromNGO;
  }

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, `Order status updated to ${orderStatus} successfully!`));
});


export {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};