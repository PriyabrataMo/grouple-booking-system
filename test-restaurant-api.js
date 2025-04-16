// Restaurant API Testing Script
const http = require("http");
const https = require("https");

// Configuration
const API_BASE_URL = "http://localhost:3000"; // Change this to match your API port

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

// Get a token for authentication
async function login(email, password) {
  try {
    console.log(`\nLogging in with ${email}`);
    const loginResponse = await makeRequest("POST", "/api/auth/login", {
      email: email,
      password: password,
    });

    if (loginResponse.data && loginResponse.data.token) {
      console.log("Authentication successful");
      return loginResponse.data.token;
    } else {
      console.error("Login failed:", loginResponse.data);
      return null;
    }
  } catch (error) {
    console.error("Error during login:", error);
    return null;
  }
}

// Test restaurant listing
async function testGetRestaurants(token) {
  console.log("\n===== Testing Get Restaurants =====");

  try {
    const response = await makeRequest("GET", "/api/restaurants", null, token);
    console.log(`Status: ${response.statusCode}`);
    console.log("Restaurants found:", response.data.restaurants?.length || 0);

    // Print the first restaurant if available
    if (response.data.restaurants && response.data.restaurants.length > 0) {
      console.log("First restaurant:", {
        id: response.data.restaurants[0].id,
        name: response.data.restaurants[0].name,
        cuisine: response.data.restaurants[0].cuisine,
      });
    }

    return response.data.restaurants || [];
  } catch (error) {
    console.error("Error getting restaurants:", error);
    return [];
  }
}

// Test creating a restaurant (admin only)
async function testCreateRestaurant(token) {
  console.log("\n===== Testing Create Restaurant =====");

  const restaurantData = {
    name: `Test Restaurant ${Date.now()}`,
    address: "123 Test Street, Testville",
    cuisine: "Italian",
    description: "A test restaurant created via API testing",
    openingTime: "09:00",
    closingTime: "22:00",
    imageUrl: "https://example.com/restaurant.jpg",
  };

  try {
    console.log(`Creating restaurant: ${restaurantData.name}`);
    const response = await makeRequest(
      "POST",
      "/api/restaurants",
      restaurantData,
      token
    );
    console.log(`Status: ${response.statusCode}`);
    console.log("Response:", response.data);

    if (response.data.restaurant) {
      return response.data.restaurant;
    }
    return null;
  } catch (error) {
    console.error("Error creating restaurant:", error);
    return null;
  }
}

// Test restaurant table management
async function testRestaurantTables(token, restaurantId) {
  console.log(
    `\n===== Testing Restaurant Tables for Restaurant ${restaurantId} =====`
  );

  if (!restaurantId) {
    console.log("No restaurant ID provided. Skipping table tests.");
    return;
  }

  try {
    // 1. Get tables for the restaurant
    console.log("\nGetting tables for restaurant");
    const getTablesResponse = await makeRequest(
      "GET",
      `/api/restaurants/${restaurantId}/tables`,
      null,
      token
    );
    console.log(`Status: ${getTablesResponse.statusCode}`);
    console.log("Tables found:", getTablesResponse.data.tables?.length || 0);

    // 2. Create a new table
    console.log("\nCreating a new table");
    const tableData = {
      tableNumber: Math.floor(Math.random() * 100) + 1, // Random table number to avoid conflicts
      capacity: 4,
      isAvailable: true,
    };

    const createTableResponse = await makeRequest(
      "POST",
      `/api/restaurants/${restaurantId}/tables`,
      tableData,
      token
    );
    console.log(`Status: ${createTableResponse.statusCode}`);
    console.log("Response:", createTableResponse.data);

    // 3. If table was created, update it
    if (createTableResponse.data.table && createTableResponse.data.table.id) {
      const tableId = createTableResponse.data.table.id;
      console.log(`\nUpdating table ${tableId}`);

      const updateData = {
        capacity: 6,
        isAvailable: false,
      };

      const updateResponse = await makeRequest(
        "PUT",
        `/api/restaurants/${restaurantId}/tables/${tableId}`,
        updateData,
        token
      );
      console.log(`Status: ${updateResponse.statusCode}`);
      console.log("Response:", updateResponse.data);

      // 4. Get tables again to verify update
      console.log("\nGetting tables after update");
      const getTablesAgainResponse = await makeRequest(
        "GET",
        `/api/restaurants/${restaurantId}/tables`,
        null,
        token
      );
      console.log(`Status: ${getTablesAgainResponse.statusCode}`);
      console.log(
        "Tables found:",
        getTablesAgainResponse.data.tables?.length || 0
      );

      // 5. Delete the table
      console.log(`\nDeleting table ${tableId}`);
      const deleteResponse = await makeRequest(
        "DELETE",
        `/api/restaurants/${restaurantId}/tables/${tableId}`,
        null,
        token
      );
      console.log(`Status: ${deleteResponse.statusCode}`);
      console.log("Response:", deleteResponse.data);
    }
  } catch (error) {
    console.error("Error in table tests:", error);
  }
}

// Test updating a restaurant
async function testUpdateRestaurant(token, restaurantId) {
  console.log(`\n===== Testing Update Restaurant ${restaurantId} =====`);

  if (!restaurantId) {
    console.log("No restaurant ID provided. Skipping update test.");
    return;
  }

  try {
    const updateData = {
      description: `Updated description at ${new Date().toISOString()}`,
      openingTime: "10:00",
      closingTime: "23:00",
    };

    console.log("Updating restaurant with data:", updateData);
    const response = await makeRequest(
      "PUT",
      `/api/restaurants/${restaurantId}`,
      updateData,
      token
    );
    console.log(`Status: ${response.statusCode}`);
    console.log("Response:", response.data);
  } catch (error) {
    console.error("Error updating restaurant:", error);
  }
}

// Main test function
async function runTests() {
  console.log("Starting Restaurant API Tests...");

  // Update these with valid credentials for your system
  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";

  // Login as admin
  const token = await login(adminEmail, adminPassword);

  if (!token) {
    console.log("Admin login failed. Cannot proceed with tests.");
    return;
  }

  // Get all restaurants
  const restaurants = await testGetRestaurants(token);

  // Create a new restaurant
  const newRestaurant = await testCreateRestaurant(token);

  if (newRestaurant) {
    // If restaurant was created successfully, test tables and updates
    await testRestaurantTables(token, newRestaurant.id);
    await testUpdateRestaurant(token, newRestaurant.id);
  } else if (restaurants.length > 0) {
    // If creation failed but we have existing restaurants, use the first one
    console.log("Using existing restaurant for tests");
    await testRestaurantTables(token, restaurants[0].id);
    await testUpdateRestaurant(token, restaurants[0].id);
  }

  console.log("\nRestaurant API Tests Completed!");
}

// Run the tests
runTests().catch(console.error);
