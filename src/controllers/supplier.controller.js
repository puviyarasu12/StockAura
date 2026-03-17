const Supplier = require("../models/Supplier");

const createSupplier = async (req, res) => {
  try {
    const { name, contactEmail, contactPhone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const existingSupplier = await Supplier.findOne({ name: name.trim() });
    if (existingSupplier) {
      return res.status(409).json({ message: "Supplier already exists" });
    }

    const supplier = await Supplier.create({
      name,
      contactEmail,
      contactPhone,
      address,
    });

    return res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();

    return res.status(200).json({
      message: "Suppliers fetched successfully",
      suppliers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.status(200).json({
      message: "Supplier fetched successfully",
      supplier,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactEmail, contactPhone, address } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    if (name) {
      const existingSupplier = await Supplier.findOne({
        name: name.trim(),
        _id: { $ne: id },
      });
      if (existingSupplier) {
        return res.status(409).json({ message: "Supplier name already exists" });
      }
      supplier.name = name;
    }

    if (contactEmail) supplier.contactEmail = contactEmail;
    if (contactPhone) supplier.contactPhone = contactPhone;
    if (address) supplier.address = address;

    await supplier.save();

    return res.status(200).json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    return res.status(200).json({
      message: "Supplier deleted successfully",
      supplier,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
};
