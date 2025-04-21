const SensorData = require("../models/sensorData.model");
class waterUsage {
  static async calculateWaterUsage() {
    const flowData = await SensorData.find().sort({ createdAt: 1 }).lean();

    if (!flowData.length) {
      return 0;
    }
    let totalWaterUsage = 0; // Tổng lượng nước sử dụng
    let previousTime = null;

    flowData.forEach((dataPoint) => {
      if (previousTime) {
        const currentTime = new Date(dataPoint.createdAt).getTime();
        const timeDifference = (currentTime - previousTime) / 60000; // Chuyển đổi sang phút

        // Số lượng nước sử dụng = Lưu lượng * thời gian chảy (phút)
        totalWaterUsage += dataPoint.flowRate * timeDifference;
      }
      previousTime = new Date(dataPoint.createdAt).getTime();
    });
    const pricePerLiter = 5000;
    const totalAmount = (totalWaterUsage * pricePerLiter) / 1000000;

    return { totalWaterUsage, totalAmount };
  }
}

module.exports = waterUsage;
