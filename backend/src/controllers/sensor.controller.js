const statsService = require('../services/stats.service');

class SensorController {
  // Lấy tất cả dữ liệu cảm biến với phân trang và lọc
  static getAllData = async (req, res) => {
    try {
      const result = await statsService.getAllData(req);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error getting sensor data:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}

module.exports = SensorController;
