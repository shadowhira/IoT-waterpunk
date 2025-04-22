const sendMail = require("../helpers/email");
const Alert = require("../models/alert.model");
const FirebaseToken = require("../models/firebaseToken.model");
const { sendNotification } = require("../helpers/firebaseNotification");

class alertService {
  static createAlert = async ({ device, alert_type, message, leak_type = 0, value = 0 }) => {
    // Gửi email (nếu cần kích hoạt lại)
    // await sendMail("thoongdeptraivcl@gmai.com", alert_type, message);

    // Gửi thông báo đến các thiết bị Firebase
    const tokens = await FirebaseToken.find().lean();
    for (const token of tokens) {
      const registrationToken = token.registrationToken;
      sendNotification(registrationToken, { alert_type, message });
    }

    // Gửi thông báo qua WebSocket
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          // WebSocket.OPEN
          client.send(
            JSON.stringify({
              topic: "alert",
              payload: {
                alert_type,
                message,
                leak_type,
                value,
                device,
                timestamp: new Date().toISOString()
              },
            })
          );
        }
      });
    }

    // Lưu cảnh báo vào cơ sở dữ liệu
    return await Alert.create({
      device,
      alert_type,
      message,
      leak_type,
      value,
      is_active: true
    });
  };

  static getAllAlert = async () => {
    return await Alert.find().sort({ createdAt: -1 }).lean();
  };

  static getActiveAlerts = async () => {
    return await Alert.find({ is_active: true }).sort({ createdAt: -1 }).lean();
  };

  static resolveAlert = async (alertId) => {
    const alert = await Alert.findByIdAndUpdate(
      alertId,
      {
        is_active: false,
        resolved_at: new Date()
      },
      { new: true }
    );

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Gửi thông báo qua WebSocket
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(
            JSON.stringify({
              topic: "alert_resolved",
              payload: alert
            })
          );
        }
      });
    }

    // Gửi lệnh reset cảnh báo rò rỉ qua MQTT (chỉ khi được gọi từ frontend)
    if (alert.leak_type > 0 && global.client && !global._isResettingLeak) {
      global.client.publish(
        "/sensor/control",
        "reset_leak",
        (err) => {
          if (err) {
            console.error("Error publishing reset_leak command:", err);
          } else {
            console.log("Reset leak command published to MQTT");
          }
        }
      );
    }

    return alert;
  };

  // Xử lý cảnh báo rò rỉ từ MQTT
  static handleLeakAlert = async (data) => {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      if (data.type === 'leak') {
        // Xác định loại rò rỉ
        let leak_type = 0;
        let message = '';

        switch (data.source) {
          case 'water_level':
            leak_type = 1;
            message = `Phát hiện rò rỉ mực nước: Mực nước giảm ${data.value} cm/phút khi máy bơm không hoạt động`;
            break;
          case 'flow_rate':
            leak_type = 2;
            message = `Phát hiện rò rỉ lưu lượng: Lưu lượng bất thường ${data.value} L/phút khi máy bơm không hoạt động`;
            break;
          case 'pump_timeout':
            leak_type = 3;
            message = `Cảnh báo máy bơm: Máy bơm hoạt động quá ${data.value} giây`;
            break;
          default:
            leak_type = 0;
            message = `Phát hiện rò rỉ không xác định: ${data.source}`;
        }

        // Tạo cảnh báo
        return await this.createAlert({
          device: 'ESP32',
          alert_type: 'Rò rỉ nước',
          message,
          leak_type,
          value: data.value
        });
      } else if (data.type === 'leak_reset') {
        try {
          // Đánh dấu đang trong quá trình reset để tránh vòng lặp
          global._isResettingLeak = true;

          // Đặt lại tất cả cảnh báo rò rỉ đang hoạt động
          const activeLeakAlerts = await Alert.find({
            is_active: true,
            leak_type: { $gt: 0 }
          });

          console.log(`Đang đặt lại ${activeLeakAlerts.length} cảnh báo rò rỉ`);

          for (const alert of activeLeakAlerts) {
            await this.resolveAlert(alert._id);
          }

          // Gửi thông báo qua WebSocket
          if (global.wss) {
            global.wss.clients.forEach((client) => {
              if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify({
                  topic: 'leak',
                  payload: {
                    detected: false,
                    type: 0,
                    timestamp: new Date().toISOString(),
                    details: null
                  }
                }));
              }
            });
          }

          return { message: 'All leak alerts resolved', count: activeLeakAlerts.length };
        } finally {
          // Đặt lại cờ đánh dấu
          global._isResettingLeak = false;
        }
      }
    } catch (error) {
      console.error("Error handling leak alert:", error);
      throw error;
    }
  };
}

module.exports = alertService;
