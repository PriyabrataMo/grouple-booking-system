// Simple API testing script
const http = require("http");
const https = require("https");

// Configuration
const API_BASE_URL = "http://localhost:3000"; // Change this to match your API port
const TOKEN = ""; // Add your authentication token here if needed

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);

    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const client = url.protocol === "https:" ? https : http;
    const req = client.request(url, options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (error) {
          console.error("Error parsing response:", error);
          console.log("Raw response:", responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions for each API endpoint
async function testAuth() {
  console.log("\n===== Testing Authentication API =====");

  // Test registration
  try {
    const registrationData = {
      username: `testuser${Date.now()}`,
      email: `testuser${Date.now()}@example.com`,
      password: "password123",
    };

    console.log(`\nRegistering user: ${registrationData.username}`);
    const registerResponse = await makeRequest(
      "POST",
      "/api/auth/register",
      registrationData
    );
    console.log(`Status: ${registerResponse.statusCode}`);
    console.log("Response:", registerResponse.data);

    // Test login with the newly created user
    console.log("\nLogging in with new user");
    const loginResponse = await makeRequest("POST", "/api/auth/login", {
      email: registrationData.email,
      password: registrationData.password,
    });
    console.log(`Status: ${loginResponse.statusCode}`);
    console.log("Response:", loginResponse.data);

    // Save the token for other tests
    if (loginResponse.data.token) {
      console.log("Authentication token received");
      return loginResponse.data.token;
    }
  } catch (error) {
    console.error("Error testing auth:", error);
  }

  return null;
}

async function testRestaurants(token) {
  console.log("\n===== Testing Restaurants API =====");

  // Get all restaurants
  try {
    console.log("\nGetting all restaurants");
    const getResponse = await makeRequest(
      "GET",
      "/api/restaurants",
      null,
      token
    );
    console.log(`Status: ${getResponse.statusCode}`);
    console.log("Response:", getResponse.data);

    // If we have restaurants, test getting a single one
    if (
      getResponse.data.restaurants &&
      getResponse.data.restaurants.length > 0
    ) {
      const firstRestaurantId = getResponse.data.restaurants[0].id;

      console.log(`\nGetting restaurant with ID: ${firstRestaurantId}`);
      const getOneResponse = await makeRequest(
        "GET",
        `/api/restaurants/${firstRestaurantId}`,
        null,
        token
      );
      console.log(`Status: ${getOneResponse.statusCode}`);
      console.log("Response:", getOneResponse.data);

      return firstRestaurantId;
    }
  } catch (error) {
    console.error("Error testing restaurants:", error);
  }

  return null;
}

async function testBookings(token, restaurantId) {
  console.log("\n===== Testing Bookings API =====");

  if (!restaurantId) {
    console.log("No restaurant ID available. Skipping booking tests.");
    return;
  }

  // Create a booking
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startTime = new Date(tomorrow.setHours(18, 0, 0, 0));
    const endTime = new Date(tomorrow.setHours(20, 0, 0, 0));

    const bookingData = {
      restaurantId: restaurantId,
      title: "Test Booking",
      description: "Created by API test script",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      guestCount: 2,
    };

    console.log("\nCreating a booking");
    const createResponse = await makeRequest(
      "POST",
      "/api/bookings",
      bookingData,
      token
    );
    console.log(`Status: ${createResponse.statusCode}`);
    console.log("Response:", createResponse.data);

    // Get all bookings
    console.log("\nGetting all bookings");
    const getResponse = await makeRequest("GET", "/api/bookings", null, token);
    console.log(`Status: ${getResponse.statusCode}`);
    console.log("Response:", getResponse.data);

    // If we created a booking, test getting it by ID
    if (createResponse.data.booking && createResponse.data.booking.id) {
      const bookingId = createResponse.data.booking.id;

      console.log(`\nGetting booking with ID: ${bookingId}`);
      const getOneResponse = await makeRequest(
        "GET",
        `/api/bookings/${bookingId}`,
        null,
        token
      );
      console.log(`Status: ${getOneResponse.statusCode}`);
      console.log("Response:", getOneResponse.data);
    }
  } catch (error) {
    console.error("Error testing bookings:", error);
  }
}

// Main test function
async function runTests() {
  console.log("Starting API Tests...");

  // Test auth first to get a token
  const token = await testAuth();

  if (!token) {
    console.log("Authentication failed or token not received. Aborting tests.");
    return;
  }

  // Test restaurants
  const restaurantId = await testRestaurants(token);

  // Test bookings
  await testBookings(token, restaurantId);

  console.log("\nAPI Tests Completed!");
}

// Run the tests
runTests().catch(console.error);
