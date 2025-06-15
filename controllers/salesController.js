// const Sale = require("../models/Sale");
// const CustomerStockAllocation = require("../models/CustomerStockAllocation");
// const mongoose = require("mongoose");

// // Create a new sale
// const createSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       invoiceId,
//       customerId,
//       billingDate,
//       items,
//       tax,
//       discount,
//       status,
//       paymentMethod,
//       paymentDate,
//       notes,
//       createdBy
//     } = req.body;

//     // Validate required fields
//     if (!invoiceId || !customerId || !items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice ID, Customer ID, and items are required"
//       });
//     }

//     // Check if invoice ID already exists
//     const existingSale = await Sale.findOne({ invoiceId });
//     if (existingSale) {
//       return res.status(400).json({
//         success: false,
//         message: "Invoice ID already exists"
//       });
//     }

//     // Validate stock availability and update CustomerStockAllocation
//     for (const item of items) {
//       const stockAllocation = await CustomerStockAllocation.findOne({
//         customerId: customerId,
//         productId: item.productId
//       }).session(session);

//       if (!stockAllocation) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: `No stock allocation found for customer and product: ${item.productName}`
//         });
//       }

//       if (stockAllocation.quantity < item.quantity) {
//         await session.abortTransaction();
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient stock for ${item.productName}. Available: ${stockAllocation.quantity}, Requested: ${item.quantity}`
//         });
//       }

//       // Update stock allocation quantity
//       stockAllocation.quantity -= item.quantity;
//       await stockAllocation.save({ session });
//     }

//     // Create the sale
//     const newSale = new Sale({
//       invoiceId,
//       customerId,
//       billingDate: billingDate || new Date(),
//       items,
//       tax: tax || 0,
//       discount: discount || 0,
//       status: status || "Pending",
//       paymentMethod,
//       paymentDate,
//       notes,
//       createdBy
//     });

//     const savedSale = await newSale.save({ session });
//     await session.commitTransaction();

//     // Populate the saved sale
//     const populatedSale = await Sale.findById(savedSale._id)
//       .populate("customerId", "name email phone")
//       .populate("items.productId", "name category brand")
//       .populate("createdBy", "name email");

//     res.status(201).json({
//       success: true,
//       message: "Sale created successfully",
//       data: populatedSale
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error creating sale:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error creating sale",
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Get all sales with pagination and filtering
// const getAllSales = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       status,
//       customerId,
//       startDate,
//       endDate,
//       search,
//       sortBy = "billingDate",
//       sortOrder = "desc"
//     } = req.query;

//     // Build filter query
//     const filter = {};
    
//     if (status) filter.status = status;
//     if (customerId) filter.customerId = customerId;
    
//     if (startDate || endDate) {
//       filter.billingDate = {};
//       if (startDate) filter.billingDate.$gte = new Date(startDate);
//       if (endDate) filter.billingDate.$lte = new Date(endDate);
//     }
    
//     if (search) {
//       filter.$or = [
//         { invoiceId: { $regex: search, $options: "i" } },
//         { "items.productName": { $regex: search, $options: "i" } },
//         { notes: { $regex: search, $options: "i" } }
//       ];
//     }

//     // Build sort object
//     const sort = {};
//     sort[sortBy] = sortOrder === "asc" ? 1 : -1;

//     // Calculate pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Get sales with pagination
//     const sales = await Sale.find(filter)
//       .populate("customerId", "name email phone address")
//       .populate("items.productId", "name category brand")
//       .populate("createdBy", "name email")
//       .populate("updatedBy", "name email")
//       .sort(sort)
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Get total count for pagination
//     const totalSales = await Sale.countDocuments(filter);
//     const totalPages = Math.ceil(totalSales / parseInt(limit));

//     // Calculate summary statistics
//     const summary = await Sale.aggregate([
//       { $match: filter },
//       {
//         $group: {
//           _id: null,
//           totalAmount: { $sum: "$totalAmount" },
//           averageAmount: { $avg: "$totalAmount" },
//           totalSales: { $sum: 1 }
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: sales,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages,
//         totalSales,
//         hasNextPage: parseInt(page) < totalPages,
//         hasPrevPage: parseInt(page) > 1
//       },
//       summary: summary[0] || { totalAmount: 0, averageAmount: 0, totalSales: 0 }
//     });

//   } catch (error) {
//     console.error("Error fetching sales:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching sales",
//       error: error.message
//     });
//   }
// };

// // Get sale by ID
// const getSaleById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const sale = await Sale.findById(id)
//       .populate("customerId", "name email phone address")
//       .populate("items.productId", "name category brand description")
//       .populate("createdBy", "name email")
//       .populate("updatedBy", "name email");

//     if (!sale) {
//       return res.status(404).json({
//         success: false,
//         message: "Sale not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: sale
//     });

//   } catch (error) {
//     console.error("Error fetching sale:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching sale",
//       error: error.message
//     });
//   }
// };

// // Update sale
// const updateSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     // Find existing sale
//     const existingSale = await Sale.findById(id).session(session);
//     if (!existingSale) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: "Sale not found"
//       });
//     }

//     // If items are being updated, handle stock allocation changes
//     if (updateData.items) {
//       // Restore stock for existing items
//       for (const existingItem of existingSale.items) {
//         const stockAllocation = await CustomerStockAllocation.findOne({
//           customerId: existingSale.customerId,
//           productId: existingItem.productId
//         }).session(session);

//         if (stockAllocation) {
//           stockAllocation.quantity += existingItem.quantity;
//           await stockAllocation.save({ session });
//         }
//       }

//       // Deduct stock for new items
//       for (const newItem of updateData.items) {
//         const stockAllocation = await CustomerStockAllocation.findOne({
//           customerId: existingSale.customerId,
//           productId: newItem.productId
//         }).session(session);

//         if (!stockAllocation) {
//           await session.abortTransaction();
//           return res.status(400).json({
//             success: false,
//             message: `No stock allocation found for product: ${newItem.productName}`
//           });
//         }

//         if (stockAllocation.quantity < newItem.quantity) {
//           await session.abortTransaction();
//           return res.status(400).json({
//             success: false,
//             message: `Insufficient stock for ${newItem.productName}. Available: ${stockAllocation.quantity}, Requested: ${newItem.quantity}`
//           });
//         }

//         stockAllocation.quantity -= newItem.quantity;
//         await stockAllocation.save({ session });
//       }
//     }

//     // Update the sale
//     const updatedSale = await Sale.findByIdAndUpdate(
//       id,
//       { ...updateData, updatedBy: updateData.updatedBy },
//       { new: true, runValidators: true, session }
//     );

//     await session.commitTransaction();

//     // Populate the updated sale
//     const populatedSale = await Sale.findById(updatedSale._id)
//       .populate("customerId", "name email phone")
//       .populate("items.productId", "name category brand")
//       .populate("createdBy", "name email")
//       .populate("updatedBy", "name email");

//     res.status(200).json({
//       success: true,
//       message: "Sale updated successfully",
//       data: populatedSale
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error updating sale:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating sale",
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Delete sale
// const deleteSale = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { id } = req.params;

//     // Find the sale to delete
//     const sale = await Sale.findById(id).session(session);
//     if (!sale) {
//       await session.abortTransaction();
//       return res.status(404).json({
//         success: false,
//         message: "Sale not found"
//       });
//     }

//     // Restore stock quantities
//     for (const item of sale.items) {
//       const stockAllocation = await CustomerStockAllocation.findOne({
//         customerId: sale.customerId,
//         productId: item.productId
//       }).session(session);

//       if (stockAllocation) {
//         stockAllocation.quantity += item.quantity;
//         await stockAllocation.save({ session });
//       }
//     }

//     // Delete the sale
//     await Sale.findByIdAndDelete(id).session(session);
//     await session.commitTransaction();

//     res.status(200).json({
//       success: true,
//       message: "Sale deleted successfully"
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     console.error("Error deleting sale:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error deleting sale",
//       error: error.message
//     });
//   } finally {
//     session.endSession();
//   }
// };

// // Get sales statistics
// const getSalesStats = async (req, res) => {
//   try {
//     const { startDate, endDate, customerId } = req.query;
    
//     const matchStage = {};
//     if (startDate || endDate) {
//       matchStage.billingDate = {};
//       if (startDate) matchStage.billingDate.$gte = new Date(startDate);
//       if (endDate) matchStage.billingDate.$lte = new Date(endDate);
//     }
//     if (customerId) matchStage.customerId = new mongoose.Types.ObjectId(customerId);

//     const stats = await Sale.aggregate([
//       { $match: matchStage },
//       {
//         $group: {
//           _id: null,
//           totalSales: { $sum: 1 },
//           totalRevenue: { $sum: "$totalAmount" },
//           averageOrderValue: { $avg: "$totalAmount" },
//           totalItemsSold: { $sum: { $sum: "$items.quantity" } }
//         }
//       }
//     ]);

//     const statusStats = await Sale.aggregate([
//       { $match: matchStage },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//           revenue: { $sum: "$totalAmount" }
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         summary: stats[0] || {
//           totalSales: 0,
//           totalRevenue: 0,
//           averageOrderValue: 0,
//           totalItemsSold: 0
//         },
//         statusBreakdown: statusStats
//       }
//     });

//   } catch (error) {
//     console.error("Error fetching sales statistics:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching sales statistics",
//       error: error.message
//     });
//   }
// };

// module.exports = {
//   createSale,
//   getAllSales,
//   getSaleById,
//   updateSale,
//   deleteSale,
//   getSalesStats
// };


const Sale = require("../models/Sale");
const CustomerStockAllocation = require("../models/CustomerStockAllocation");
const mongoose = require("mongoose");

// Create a new sale
const createSale = async (req, res) => {
  try {
    const {
      invoiceId,
      customerId,
      billingDate,
      items,
      tax,
      discount,
      status,
      paymentMethod,
      paymentDate,
      notes,
      createdBy
    } = req.body;

    // Validate required fields
    if (!invoiceId || !customerId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID, Customer ID, and items are required"
      });
    }

    // Check if invoice ID already exists
    const existingSale = await Sale.findOne({ invoiceId });
    if (existingSale) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID already exists"
      });
    }

    // Validate stock availability and update CustomerStockAllocation
    for (const item of items) {
      const stockAllocation = await CustomerStockAllocation.findOne({
        customerId: customerId,
        productId: item.productId
      });

      if (!stockAllocation) {
        return res.status(400).json({
          success: false,
          message: `No stock allocation found for customer and product: ${item.productName}`
        });
      }

      if (stockAllocation.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}. Available: ${stockAllocation.quantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Update stock allocations (after validation passes)
    for (const item of items) {
      await CustomerStockAllocation.findOneAndUpdate(
        {
          customerId: customerId,
          productId: item.productId
        },
        {
          $inc: { quantity: -item.quantity }
        }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const finalTax = tax || 0;
    const finalDiscount = discount || 0;
    const totalAmount = subtotal + finalTax - finalDiscount;

    // Create the sale
    const newSale = new Sale({
      invoiceId,
      customerId,
      billingDate: billingDate || new Date(),
      items,
      subtotal,
      tax: finalTax,
      discount: finalDiscount,
      totalAmount,
      status: status || "Pending",
      paymentMethod,
      paymentDate,
      notes,
      createdBy
    });

    const savedSale = await newSale.save();

    // Populate the saved sale
    const populatedSale = await Sale.findById(savedSale._id)
    //   .populate("customerId", "name email phone")
    //   .populate("items.productId", "name category brand")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Sale created successfully",
      data: populatedSale
    });

  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({
      success: false,
      message: "Error creating sale",
      error: error.message
    });
  }
};

// Get all sales with pagination and filtering
const getAllSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customerId,
      startDate,
      endDate,
      search,
      sortBy = "billingDate",
      sortOrder = "desc"
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    
    if (startDate || endDate) {
      filter.billingDate = {};
      if (startDate) filter.billingDate.$gte = new Date(startDate);
      if (endDate) filter.billingDate.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { invoiceId: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sales with pagination
    const sales = await Sale.find(filter)
    //   .populate("customerId", "name email phone address")
    //   .populate("items.productId", "name category brand")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSales = await Sale.countDocuments(filter);
    const totalPages = Math.ceil(totalSales / parseInt(limit));

    // Calculate summary statistics
    const summary = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          averageAmount: { $avg: "$totalAmount" },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSales,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      summary: summary[0] || { totalAmount: 0, averageAmount: 0, totalSales: 0 }
    });

  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales",
      error: error.message
    });
  }
};

// Get sales by customer ID with pagination and filtering
const getSalesByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search,
      sortBy = "billingDate",
      sortOrder = "desc"
    } = req.query;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format"
      });
    }

    // Build filter query with customer ID as base filter
    const filter = { customerId: new mongoose.Types.ObjectId(customerId) };
    
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.billingDate = {};
      if (startDate) filter.billingDate.$gte = new Date(startDate);
      if (endDate) filter.billingDate.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { invoiceId: { $regex: search, $options: "i" } },
        { "items.productName": { $regex: search, $options: "i" } },
        { "items.brand": { $regex: search, $options: "i" } },
        { "items.model": { $regex: search, $options: "i" } },
        { "items.sku": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sales with pagination
    const sales = await Sale.find(filter)
      .populate("customerId", "name email phone address")
      .populate("items.productId", "name category brand description")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSales = await Sale.countDocuments(filter);
    const totalPages = Math.ceil(totalSales / parseInt(limit));

    // Calculate summary statistics for this customer
    const summary = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          averageAmount: { $avg: "$totalAmount" },
          totalSales: { $sum: 1 },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
          totalTax: { $sum: "$tax" },
          totalDiscount: { $sum: "$discount" }
        }
      }
    ]);

    // Get status breakdown for this customer
    const statusBreakdown = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Get recent sales activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentActivity = await Sale.aggregate([
      { 
        $match: { 
          customerId: new mongoose.Types.ObjectId(customerId),
          billingDate: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$billingDate" 
            } 
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSales,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      summary: summary[0] || { 
        totalAmount: 0, 
        averageAmount: 0, 
        totalSales: 0,
        totalItemsSold: 0,
        totalTax: 0,
        totalDiscount: 0
      },
      statusBreakdown,
      recentActivity
    });

  } catch (error) {
    console.error("Error fetching sales by customer ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales by customer ID",
      error: error.message
    });
  }
};

// Get sale by ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id)
      .populate("customerId", "name email phone address")
      .populate("items.productId", "name category brand description")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });

  } catch (error) {
    console.error("Error fetching sale:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sale",
      error: error.message
    });
  }
};

// Update sale
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find existing sale
    const existingSale = await Sale.findById(id);
    if (!existingSale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // If items are being updated, handle stock allocation changes
    if (updateData.items) {
      // Calculate new totals if items are updated
      const subtotal = updateData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const finalTax = updateData.tax !== undefined ? updateData.tax : existingSale.tax;
      const finalDiscount = updateData.discount !== undefined ? updateData.discount : existingSale.discount;
      
      updateData.subtotal = subtotal;
      updateData.totalAmount = subtotal + finalTax - finalDiscount;
      // Restore stock for existing items
      for (const existingItem of existingSale.items) {
        await CustomerStockAllocation.findOneAndUpdate(
          {
            customerId: existingSale.customerId,
            productId: existingItem.productId
          },
          {
            $inc: { quantity: existingItem.quantity }
          }
        );
      }

      // Validate and deduct stock for new items
      for (const newItem of updateData.items) {
        const stockAllocation = await CustomerStockAllocation.findOne({
          customerId: existingSale.customerId,
          productId: newItem.productId
        });

        if (!stockAllocation) {
          // Restore the stock we just added back
          for (const existingItem of existingSale.items) {
            await CustomerStockAllocation.findOneAndUpdate(
              {
                customerId: existingSale.customerId,
                productId: existingItem.productId
              },
              {
                $inc: { quantity: -existingItem.quantity }
              }
            );
          }
          
          return res.status(400).json({
            success: false,
            message: `No stock allocation found for product: ${newItem.productName}`
          });
        }

        if (stockAllocation.quantity < newItem.quantity) {
          // Restore the stock we just added back
          for (const existingItem of existingSale.items) {
            await CustomerStockAllocation.findOneAndUpdate(
              {
                customerId: existingSale.customerId,
                productId: existingItem.productId
              },
              {
                $inc: { quantity: -existingItem.quantity }
              }
            );
          }
          
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${newItem.productName}. Available: ${stockAllocation.quantity}, Requested: ${newItem.quantity}`
          });
        }
      }

      // Deduct stock for new items
      for (const newItem of updateData.items) {
        await CustomerStockAllocation.findOneAndUpdate(
          {
            customerId: existingSale.customerId,
            productId: newItem.productId
          },
          {
            $inc: { quantity: -newItem.quantity }
          }
        );
      }
    }

    // Update the sale
    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      { ...updateData, updatedBy: updateData.updatedBy },
      { new: true, runValidators: true }
    );

    // Populate the updated sale
    const populatedSale = await Sale.findById(updatedSale._id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "name category brand")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: populatedSale
    });

  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({
      success: false,
      message: "Error updating sale",
      error: error.message
    });
  }
};

// Delete sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the sale to delete
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found"
      });
    }

    // Restore stock quantities
    for (const item of sale.items) {
      await CustomerStockAllocation.findOneAndUpdate(
        {
          customerId: sale.customerId,
          productId: item.productId
        },
        {
          $inc: { quantity: item.quantity }
        }
      );
    }

    // Delete the sale
    await Sale.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Sale deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting sale",
      error: error.message
    });
  }
};

// Get sales statistics
const getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.billingDate = {};
      if (startDate) matchStage.billingDate.$gte = new Date(startDate);
      if (endDate) matchStage.billingDate.$lte = new Date(endDate);
    }
    if (customerId) matchStage.customerId = new mongoose.Types.ObjectId(customerId);

    const stats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } }
        }
      }
    ]);

    const statusStats = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItemsSold: 0
        },
        statusBreakdown: statusStats
      }
    });

  } catch (error) {
    console.error("Error fetching sales statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales statistics",
      error: error.message
    });
  }
};

module.exports = {
  createSale,
  getAllSales,
  getSalesByCustomerId,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesStats
};