// client/src/pages/Shop/ProductDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // useParams to get ID from URL
import ecommerceService from '../../api/ecommerce.js'; // Import the ecommerce service
import { useSelector } from 'react-redux'; // For auth status and user info (for place order)

const ProductDetails = () => {
  const { productId } = useParams(); // Get productId from the URL
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.userData); // Current logged-in user
  const authStatus = useSelector(state => state.auth.authStatus); // Check if user is logged in
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // For Add to Cart button
  const [actionError, setActionError] = useState(''); // For Add to Cart button error

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchedProduct = await ecommerceService.getProductById(productId);
        setProduct(fetchedProduct);
      } catch (err) {
        console.error("ProductDetails fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load product details.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) { // Only fetch if productId is available
      fetchProductDetails();
    }

  }, [productId]); // Rerun if productId changes

  /**
   * Handles the "Add to Cart" or "Buy Now" action.
   * For simplicity, this will directly attempt to place an order for 1 item.
   * In a real app, this would add to a cart state, then checkout page.
   */
  const handleAddToCart = async () => {
    if (!authStatus || !user) {
      alert("Please log in to purchase items."); // Use a better notification system in a real app
      navigate('/login');
      return;
    }

    if (!product || product.stock === 0) {
      setActionError("Item is out of stock.");
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      // Directly place an order for 1 item
      const orderData = {
        items: [{ productId: product._id, quantity: 1 }],
        // For shipping address, we'll prompt the user or use a default/saved address.
        // For now, let's use a dummy/prompted address for testing.
        shippingAddress: {
            street: prompt("Enter Street Address:"),
            city: prompt("Enter City:"),
            state: prompt("Enter State:"),
            pincode: prompt("Enter Pincode:"),
            contactNumber: prompt("Enter Contact Number:"),
        }
      };

      // Basic validation for prompted fields
      if (!orderData.shippingAddress.street || !orderData.shippingAddress.city ||
          !orderData.shippingAddress.state || !orderData.shippingAddress.pincode ||
          !orderData.shippingAddress.contactNumber) {
          setActionError("All shipping address fields are required.");
          setActionLoading(false);
          return;
      }

      const response = await ecommerceService.placeOrder(orderData);
      if (response) {
        alert("Order placed successfully! NGO will contact you for fulfillment."); // Success message
        // Optionally update product stock in UI or redirect to "My Orders"
        navigate('/dashboard'); // Redirect to dashboard or orders page
      } else {
        setActionError('Failed to place order.');
      }
    } catch (err) {
      console.error("Add to Cart / Place Order Error:", err.response?.data || err.message);
      setActionError(err.message || 'Failed to add to cart/place order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Product Details...</h2>
        <p className="text-gray-600 mt-4">Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load product details. Please check the ID or try again.</p>
        <Link to="/shop" className="text-blue-600 hover:underline mt-4 block">Back to Shop</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Product Not Found</h2>
        <p className="text-gray-600 mt-4">The product you are looking for does not exist or is not available.</p>
        <Link to="/shop" className="text-blue-600 hover:underline mt-4 block">Back to Shop</Link>
      </div>
    );
  }
  
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">{product.name}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Product Image */}
        <div className="md:w-1/3 flex-shrink-0">
          <img 
            src={product.imageUrl || 'https://via.placeholder.com/300?text=No+Image'} 
            alt={product.name} 
            className="w-full h-auto object-cover rounded-lg shadow-md" 
          />
        </div>

        {/* Product Details */}
        <div className="md:w-2/3 text-left">
          {actionError && <div className="alert alert-danger mb-4">{actionError}</div>} {/* Display action errors */}
          <h2 className="text-3xl font-semibold text-blue-700 mb-4">{product.name}</h2>
          <p className="text-gray-700 text-lg mb-6">{product.description}</p>
          
          <div className="mb-6">
            <p className="text-4xl font-bold text-green-600 mb-2">₹{product.price.toFixed(2)}</p>
            <p className="text-gray-600 text-sm">Category: {product.category}</p>
            <p className={`text-lg font-semibold ${isOutOfStock ? 'text-red-500' : 'text-green-500'}`}>
              Status: {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} available)`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button 
              onClick={handleAddToCart}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
              disabled={isOutOfStock || actionLoading} // Disable if out of stock or loading
            >
              {actionLoading ? 'Processing...' : (isOutOfStock ? 'Out of Stock' : 'Add to Cart')}
            </button>
            <Link to="/shop" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg">
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;