// import React from 'react';
// import { Link } from 'react-router-dom';

// const Signup = () => {
//   return (
//     <div className="container py-12 text-center">
//       <h2 className="text-3xl font-semibold mb-6">Register with Clean Shores</h2>
//       <p className="text-lg text-gray-700 mb-8">Choose your registration type to join our community and start making a difference.</p>
//       <div className="flex justify-center space-x-4">
//         {/* Link to regular user registration */}
//         <Link to="/signup/user" className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg transition-colors">
//           Register as User
//         </Link>
//         {/* Link to admin registration */}
//         <Link to="/signup/admin" className="btn btn-secondary bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md text-lg transition-colors">
//           Register as Admin
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default Signup;

import React from 'react';
import { Link } from 'react-router-dom';

const Signup = () => {
  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6">Register with Clean Shores</h2>
      <p className="text-lg text-gray-700 mb-8">Choose your registration type to join our community and start making a difference.</p>
      <div className="flex justify-center space-x-4">
        {/* Link to regular user registration */}
        <Link to="/signup/user" className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg transition-colors">
          Register as User
        </Link>
        {/* Link to admin registration */}
        <Link to="/signup/admin" className="btn btn-secondary bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-md text-lg transition-colors">
          Register as Admin
        </Link>
      </div>
    </div>
  );
};

export default Signup;