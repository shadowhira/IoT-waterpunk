const admin = require("../config/config.firebase");

const sendNotification = async (fcmToken, notificationData) => {
  const message = {
    notification: {
      title: notificationData.title,
      body: notificationData.body,
    },
    token: fcmToken,  // This is the Firebase token of the target device
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotification };
