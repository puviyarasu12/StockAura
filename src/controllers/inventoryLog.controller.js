const InventoryLog = require("../models/InventoryLog");

const getAllLogs = async (req, res) => {
  try {
    const logs = await InventoryLog.find()
      .populate("product", "name barcode")
      .populate("performedBy", "email")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      message: "Inventory logs fetched successfully",
      logs,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getLogsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const logs = await InventoryLog.find({ product: productId })
      .populate("performedBy", "email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Product logs fetched successfully",
      logs,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllLogs,
  getLogsByProduct,
};
