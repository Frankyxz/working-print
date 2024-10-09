const usb = require("usb");
const express = require("express");
const router = express.Router();

router.get("/listUSBDevices", (req, res) => {
  try {
    const devices = usb.getDeviceList();
    const deviceList = devices.map((device) => {
      return {
        vendorId: device.deviceDescriptor.idVendor,
        productId: device.deviceDescriptor.idProduct,
      };
    });
    res.status(200).json(deviceList);
  } catch (error) {
    console.error("Error listing USB devices:", error);
    res.status(500).json({ error: "Error listing USB devices" });
  }
});

module.exports = router;
