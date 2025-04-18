import express from "express";
import {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantTables,
  createTable,
  updateTable,
  deleteTable,
  getPresignedUploadUrl,
  getPresignedAccessUrl,
} from "../controllers/restaurantController";
import { authenticateToken } from "../middleware/authMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Restaurant and table management
 */

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Restaurant routes
/**
 * @swagger
 * /api/restaurants:
 *   get:
 *     summary: Retrieve a list of restaurants
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", getRestaurants as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.get("/:id", getRestaurantById as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/restaurants:
 *   post:
 *     summary: Create a new restaurant (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - phone
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional restaurant image file
 *     responses:
 *       201:
 *         description: Restaurant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       500:
 *         description: Server error or image upload failed
 */
router.post(
  "/",
  upload.single("image"),
  createRestaurant as unknown as express.RequestHandler
);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   put:
 *     summary: Update an existing restaurant (Admin or associated Staff only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new restaurant image file
 *     responses:
 *       200:
 *         description: Restaurant updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User cannot update this restaurant)
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error or image upload failed
 */
router.put(
  "/:id",
  upload.single("image"),
  updateRestaurant as unknown as express.RequestHandler
);

/**
 * @swagger
 * /api/restaurants/{id}:
 *   delete:
 *     summary: Delete a restaurant (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *     responses:
 *       204:
 *         description: Restaurant deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User is not an admin)
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", deleteRestaurant as unknown as express.RequestHandler);

// Table routes
/**
 * @swagger
 * /api/restaurants/{id}/tables:
 *   get:
 *     summary: Get tables for a specific restaurant
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: A list of tables for the restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RestaurantTable'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:id/tables",
  getRestaurantTables as unknown as express.RequestHandler
);

/**
 * @swagger
 * /api/restaurants/{id}/tables:
 *   post:
 *     summary: Create a new table for a restaurant (Admin or associated Staff only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableInput'
 *     responses:
 *       201:
 *         description: Table created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantTable'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User cannot add tables to this restaurant)
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Server error
 */
router.post("/:id/tables", createTable as unknown as express.RequestHandler);

/**
 * @swagger
 * /api/restaurants/{id}/tables/{tableId}:
 *   put:
 *     summary: Update a table (Admin or associated Staff only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *       - in: path
 *         name: tableId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Table ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TableUpdateInput'
 *     responses:
 *       200:
 *         description: Table updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestaurantTable'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User cannot update this table)
 *       404:
 *         description: Restaurant or Table not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id/tables/:tableId",
  updateTable as unknown as express.RequestHandler
);

/**
 * @swagger
 * /api/restaurants/{id}/tables/{tableId}:
 *   delete:
 *     summary: Delete a table (Admin or associated Staff only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Restaurant ID
 *       - in: path
 *         name: tableId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Table ID
 *     responses:
 *       204:
 *         description: Table deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (User cannot delete this table)
 *       404:
 *         description: Restaurant or Table not found
 *       500:
 *         description: Server error
 */
router.delete(
  "/:id/tables/:tableId",
  deleteTable as unknown as express.RequestHandler
);

// Presigned URL routes
/**
 * @swagger
 * /api/restaurants/presigned-upload:
 *   get:
 *     summary: Get a presigned URL for uploading a restaurant image (Admin or Staff)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fileName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the file to be uploaded
 *       - in: query
 *         name: fileType
 *         schema:
 *           type: string
 *         required: true
 *         description: The MIME type of the file (e.g., image/jpeg)
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uploadUrl:
 *                   type: string
 *                   format: url
 *                 key:
 *                   type: string
 *                   description: The S3 object key
 *       400:
 *         description: Missing or invalid query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Error generating presigned URL
 */
router.get(
  "/presigned-upload",
  getPresignedUploadUrl as unknown as express.RequestHandler
);

/**
 * @swagger
 * /api/restaurants/presigned-access:
 *   get:
 *     summary: Get a presigned URL for accessing a restaurant image
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: The S3 object key of the image
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessUrl:
 *                   type: string
 *                   format: url
 *       400:
 *         description: Missing or invalid query parameter 'key'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error generating presigned URL
 */
router.get(
  "/presigned-access",
  getPresignedAccessUrl as unknown as express.RequestHandler
);

export default router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         address:
 *           type: string
 *         phone:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: url
 *           nullable: true
 *         imageKey:
 *           type: string
 *           nullable: true
 *           description: S3 object key for the image
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         tables:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RestaurantTable'
 *     RestaurantTable:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         restaurantId:
 *           type: string
 *           format: uuid
 *         tableNumber:
 *           type: integer
 *         capacity:
 *           type: integer
 *         isAvailable:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TableInput:
 *       type: object
 *       required:
 *         - tableNumber
 *         - capacity
 *       properties:
 *         tableNumber:
 *           type: integer
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         isAvailable:
 *           type: boolean
 *           default: true
 *     TableUpdateInput:
 *       type: object
 *       properties:
 *         tableNumber:
 *           type: integer
 *         capacity:
 *           type: integer
 *           minimum: 1
 *         isAvailable:
 *           type: boolean
 */
