// client/src/pages/Shop.jsx
import React, { useEffect, useState } from 'react';
import ecommerceService from '../api/ecommerce.js'; // Import the new ecommerce service
import { Link } from 'react-router-dom'; // For "View Details" link

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        // Backend's getAllProducts is a PUBLIC route, so no authentication is strictly needed here.
        // It fetches only 'isAvailable: true' products by default.
        const allProducts = await ecommerceService.getAllProducts(); 
        setProducts(allProducts);
      } catch (err) {
        console.error("Shop fetch products error:", err.response?.data || err.message);
        setError(err.message || 'Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts(); // Fetch products on component mount

  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Shop Items...</h2>
        <p className="text-gray-600 mt-4">Discover cleanup accessories.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load shop items. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Cleaning Accessories Shop</h2>
      {products.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No products available in the shop yet. Check back soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col items-center text-center">
              <img 
                src={product.imageUrl || 'https://via.placeholder.com/150?text=No+Image'} 
                alt={product.name} 
                className="w-32 h-32 object-cover rounded-md mb-4"
              />
              <h3 className="text-xl font-semibold mb-2 text-blue-700">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
              <p className="text-lg font-bold text-green-600 mb-4">₹{product.price.toFixed(2)}</p>
              
              <div className="mt-auto flex justify-center w-full"> {/* Use mt-auto to push buttons to bottom */}
                <Link to={`/shop/${product._id}`} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm mr-2">
                  View Details
                </Link>
                {product.stock > 0 ? (
                    <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors text-sm">
                        Add to Cart {/* TODO: Implement cart functionality */}
                    </button>
                ) : (
                    <span className="text-red-500 text-sm font-semibold">Out of Stock</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;