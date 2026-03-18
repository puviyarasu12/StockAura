const RestockRequest = require("../models/RestockRequest");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const InventoryLog = require("../models/InventoryLog");
const { sendMail } = require("../utils/mailer");

// Helper to populate consistently
const populateRestockRequest = async (doc) => {
  return await doc.populate([
    { path: "product" },
    { path: "supplier" },
    { path: "createdBy", select: "email role" },
  ]);
};

function buildRestockEmail({ supplierName, productName, barcode, requestedQty, notes }) {
  return {
    subject: `Restock request: ${productName} (${requestedQty})`,
    text:
      `Hello ${supplierName || "Supplier"},\n\n` +
      `We would like to request a restock for the following product:\n\n` +
      `- Product: ${productName}\n` +
      (barcode ? `- Barcode: ${barcode}\n` : "") +
      `- Requested quantity: ${requestedQty}\n` +
      (notes ? `- Notes: ${notes}\n` : "") +
      `\nPlease confirm availability and expected delivery timeline.\n\n` +
      `Regards,\nStockAura Admin\n`,
  };
}

const createRestockRequest = async (req, res) => {
  try {
    const { productId, requestedQty, notes = "", sendEmail: sendEmailFlag } = req.body || {};

    console.log("Restock request payload:", { productId, requestedQty, notes, sendEmailFlag: !!sendEmailFlag });

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const product = await Product.findById(productId).populate("supplier");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.supplier) return res.status(400).json({ message: "Product has no supplier assigned" });

    const supplier = product.supplier;
    console.log("Found product:", product.name, "supplier:", supplier.name, "email:", supplier.contactEmail || "missing");

    let qty = Number(requestedQty);
    if (isNaN(qty) || qty <= 0) {
      qty = Math.max(product.lowStockThreshold * 2, product.quantity + 10);
      console.log("Used default suggested qty:", qty);
    }

    // Create the draft first
    let requestDoc = await RestockRequest.create({
      product: product._id,
      supplier: supplier._id,
      requestedQty: qty,
      notes: String(notes || ""),
      status: "draft",
      createdBy: req.user?._id, // Ensure your auth middleware is working
    });

    if (Boolean(sendEmailFlag)) {
      try {
        if (!supplier.contactEmail) {
          console.warn(`Supplier missing contactEmail: ${supplier.name}`);
        } else {
          const adminNotify = process.env.ADMIN_NOTIFY_EMAIL || "puviarasu787@gmail.com";
          const mailBody = buildRestockEmail({
            supplierName: supplier.name,
            productName: product.name,
            barcode: product.barcode,
            requestedQty: qty,
            notes: String(notes || ""),
          });

          console.log("Sending email to:", supplier.contactEmail);
          // Attempt to send mail
          await sendMail({
            to: supplier.contactEmail,
            cc: adminNotify,
            subject: mailBody.subject,
            text: mailBody.text,
          });

          // Update status only if mail succeeds
          requestDoc.status = "requested";
          requestDoc.emailedTo = supplier.contactEmail;
          requestDoc.emailedAt = new Date();
          await requestDoc.save();
          console.log("Email sent successfully, status updated to requested");
        }
      } catch (mailError) {
        console.error("Failed to send restock email:", mailError.message);
        // Keep as draft, don't fail the request
      }
    }

    await populateRestockRequest(requestDoc);

    return res.status(201).json({
      message: requestDoc.status === "requested" ? "Request sent to supplier" : "Draft created",
      restockRequest: requestDoc,
    });
  } catch (error) {
    console.error("RESTOCK_REQUEST_CREATE_ERROR:", error);
    return res.status(500).json({ message: "Failed to create restock request: " + error.message });
  }
};

const listRestockRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await RestockRequest.find(filter)
      .populate(["product", "supplier", { path: "createdBy", select: "email role" }])
      .sort({ createdAt: -1 });

    return res.status(200).json({ restockRequests: requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const receiveRestockRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedQty, reason } = req.body || {};

    const rr = await RestockRequest.findById(id);
    if (!rr) return res.status(404).json({ message: "Restock request not found" });
    if (rr.status === "received") return res.status(400).json({ message: "Already received" });

    const qty = Number(receivedQty || rr.requestedQty);
    const product = await Product.findById(rr.product);
    
    if (!product) return res.status(404).json({ message: "Product no longer exists" });

    // Atomic update
    product.quantity += qty;
    await product.save();

    await InventoryLog.create({
      product: product._id,
      action: "added",
      quantity: qty,
      reason: reason || `Restock received (Req: ${rr._id})`,
      performedBy: req.user?._id,
    });

    rr.status = "received";
    await rr.save();
    await populateRestockRequest(rr);

    return res.status(200).json({ message: "Inventory updated", restockRequest: rr });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { createRestockRequest, listRestockRequests, receiveRestockRequest };