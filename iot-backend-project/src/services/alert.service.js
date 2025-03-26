const sendMail = require("../helpers/email");
const Alert = require("../models/alert.model");
const FirebaseToken = require("../models/firebaseToken.model");
const { sendNotification } = require("../helpers/firebaseNotification");

class alertService {
  static createAlert = async ({ deviceId, alert_type, message }) => {
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
              topic: "switch system",
              payload: {
                alert_type,
                message,
              },
            })
          );
        }
      });
    }

    // Lưu cảnh báo vào cơ sở dữ liệu
    return await Alert.create({ deviceId, alert_type, message });
  };

  static getAllAlert = async () => {
    return await Alert.find().lean();
  };
}

module.exports = alertService;
