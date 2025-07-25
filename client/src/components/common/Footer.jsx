import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-5 text-center mt-auto">
      <div className="container flex justify-center items-center">
        <p>&copy; {new Date().getFullYear()} Clean Shores. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;