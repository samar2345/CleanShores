    // server/src/routes/ecommerce.routes.js
    import { Router } from 'express';
    import {
        addProduct,
        getAllProducts,
        getProductById,
        updateProduct,
        deleteProduct,
        placeOrder,
        getMyOrders,
        getAllOrders,
        updateOrderStatus,
    } from '../controllers/ecommerce.controller.js'; // Import ecommerce controllers
    import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware
    import { upload } from '../middlewares/multer.middleware.js'; // Multer for file uploads


    //testing 
    // const testAddProduct = async (req, res) => { // Made async to use await for fs.unlink
    //     console.log('--- TEST ADD PRODUCT CONTROLLER ---');
    //     console.log('req.body:', req.body); // Should have text fields
    //     console.log('req.file (from upload.single):', req.file); // Will be undefined here
    //     console.log('req.files (from upload.fields):', req.files); // <--- THIS IS WHERE THE FILE IS

    //     const productImageUrlLocalPath = req.files?.productImage?.[0]?.path; // <--- CORRECT WAY TO ACCESS
    //     console.log('productImageUrlLocalPath (extracted):', productImageUrlLocalPath);

    //     if (productImageUrlLocalPath) { // Check if path was actually found
    //         // Optional: Clean up the temp file after logging, just for this test
    //         try {
    //             await fs.unlink(productImageUrlLocalPath);
    //             console.log(`Test: Successfully deleted local temp file: ${productImageUrlLocalPath}`);
    //         } catch (unlinkError) {
    //             console.error(`Test: Failed to delete local temp file ${productImageUrlLocalPath}:`, unlinkError);
    //         }
    //         return res.status(200).json({
    //             message: "File received in test!",
    //             file: req.files.productImage[0] // Return the full file object
    //         });
    //     } else {
    //         return res.status(400).json({ message: "No file received in test (or field name mismatch)." });
    //     }
    // };


    const router = Router();

    // router.route('/products')
    //     // Temporarily replace the real addProduct route with the test one
    //     // Make sure to add verifyJWT and authorizeRoles back after testing
    //     // .post(upload.single('productImage'), testAddProduct);
    //     .post(
    //     upload.fields([ 
    //         { name: "productImage", maxCount: 1 }
    //     ]),
    //     testAddProduct
    // );
        




    // --- Product Management (NGO Only) ---
    router.route('/products')
        .post(verifyJWT, authorizeRoles('ngo'), upload.single('productImage'), addProduct) // NGO adds product with image
        .get(getAllProducts); // Publicly accessible (for Browse shop)

    router.route('/products/:id')
        .get(getProductById) // Publicly accessible
        .put(verifyJWT, authorizeRoles('ngo'), upload.single('productImage'), updateProduct) // NGO updates product (can include new image)
        .delete(verifyJWT, authorizeRoles('ngo'), deleteProduct); // NGO deletes product

    // --- Order Management (User/Admin Place, NGO Manage) ---
    router.route('/orders')
        .post(verifyJWT, placeOrder) // Any logged-in user/admin can place an order
        .get(verifyJWT, authorizeRoles('ngo'), getAllOrders); // Only NGO can view all orders

    router.route('/orders/my-orders')
        .get(verifyJWT, getMyOrders); // User/Admin views their own orders

    router.route('/orders/:id/status')
        .patch(verifyJWT, authorizeRoles('ngo'), updateOrderStatus); // Only NGO can update order status

    export default router;

