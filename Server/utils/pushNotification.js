/**
 * Push Notification utility using Firebase Cloud Messaging (FCM)
 * Requires: firebase-admin package
 */

// TODO: Initialize Firebase Admin SDK
// const admin = require('firebase-admin');
// const serviceAccount = require('../config/firebase-service-account.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

const sendPushNotification = async ({ deviceToken, title, body, data = {} }) => {
  try {
    // TODO: Uncomment when Firebase is configured
    // const message = {
    //   notification: { title, body },
    //   data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    //   token: deviceToken,
    // };
    // const response = await admin.messaging().send(message);
    // return { success: true, messageId: response };

    console.log(`[PUSH] Token: ${deviceToken}, Title: ${title}, Body: ${body}`);
    return { success: true, messageId: "mock-message-id" };
  } catch (error) {
    console.error("Push notification failed:", error);
    return { success: false, error: error.message };
  }
};

const sendMultiplePushNotifications = async ({ deviceTokens, title, body, data = {} }) => {
  try {
    // TODO: Uncomment when Firebase is configured
    // const message = {
    //   notification: { title, body },
    //   data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    //   tokens: deviceTokens,
    // };
    // const response = await admin.messaging().sendEachForMulticast(message);
    // return { success: true, successCount: response.successCount, failureCount: response.failureCount };

    console.log(`[PUSH MULTI] Tokens: ${deviceTokens.length}, Title: ${title}`);
    return { success: true, successCount: deviceTokens.length, failureCount: 0 };
  } catch (error) {
    console.error("Multi push notification failed:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification, sendMultiplePushNotifications };
