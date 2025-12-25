import React, { useState } from "react";
import image1 from "./background.jpg"; // Import the background image
import { Link } from "react-router-dom"; // Link component for navigation
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase method for creating a new user
import { auth, database } from "../firebase"; // Import Firebase authentication and database
import { ref, set, get } from "firebase/database"; // Firebase Realtime Database methods

function SignUp() {
  // State for storing the entered username
  const [username, setUsername] = useState("");

  // State for storing the entered email
  const [email, setEmail] = useState("");

  // State for storing the entered password
  const [password, setPassword] = useState("");

  // Function to validate the username format
  const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9]{3,15}$/; // Username must be alphanumeric and 3-15 characters long
    return usernameRegex.test(username);
  };

  // Function to handle user sign-up
  const signUp = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Validate that all input fields are filled
    if (!username || !email || !password) {
      alert("Please fill in all fields."); // Show alert if any field is empty
      return;
    }

    // Validate the username format
    if (!isValidUsername(username)) {
      alert(
        "Invalid username. Username must be 3-15 characters long and contain only letters and numbers."
      );
      return;
    }

    try {
      const usersRef = ref(database, "users"); // Reference to the "users" node in the database
      const snapshot = await get(usersRef); // Fetch all existing users

      if (snapshot.exists()) {
        const usersData = snapshot.val(); // Get existing users' data

        // Check if the username already exists
        const usernameExists = Object.values(usersData).some(
          (user) => user.username === username
        );

        // Check if the email already exists
        const emailExists = Object.values(usersData).some(
          (user) => user.email === email
        );

        if (usernameExists) {
          alert("Username is already taken. Please choose a different one.");
          return;
        }

        if (emailExists) {
          alert("Email is already registered. Please use a different email.");
          return;
        }
      }

      // Create a new user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user; // Get the newly created user's information

      // Save the new user's data to the database under their UID
      await set(ref(database, `users/${user.uid}`), {
        username: username,
        email: email,
      });

      // Show a success message
      alert(
        `User signed up successfully!\nWelcome, ${username}!\nYou can now log in with your credentials.`
      );
    } catch (error) {
      // Handle errors during sign-up
      alert(`Error Signing Up: ${error.message}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Background Image */}
      <div className="absolute w-full h-full">
        <img
          src={image1}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Dark overlay over the background */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Sign-up form container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          {/* Form heading */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Create Account
          </h2>
          <form onSubmit={signUp}>
            {/* Username input field */}
            <div className="mb-3">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-600"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)} // Update the username state
                className="mt-0.5 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
              />
            </div>

            {/* Email input field */}
            <div className="mb-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} // Update the email state
                className="mt-0.5 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Password input field */}
            <div className="mb-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} // Update the password state
                className="mt-0.5 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              Sign Up
            </button>
          </form>

          {/* Redirect to login page */}
          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link to="/" className="text-blue-500 hover:underline dark:text-purple-400">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
