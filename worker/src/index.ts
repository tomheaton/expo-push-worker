import { Expo, type ExpoPushMessage } from "expo-server-sdk";

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

export default {
  async fetch(request: Request) {
    if (request.url.endsWith("/send") && request.method === "POST") {
      return await handlePushNotifications();
    }

    if (request.url.endsWith("/token") && request.method === "POST") {
      // TODO: fix error handling here
      const data: any = await request.json();
      if (!data || !data.token) {
        return new Response("token not provided", { status: 400 });
      }

      console.log(`token: ${data.token}`);
      return new Response("token received");
    }

    return new Response(`request method: ${request.method}`);
  },
};

const handlePushNotifications = async () => {
  // Create the messages that you want to send to clients
  let messages: ExpoPushMessage[] = [];
  // let pushTokens = ["ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"];
  let pushTokens = [`${process.env.EXPO_ACCESS_TOKEN}`];

  pushTokens.forEach((pushToken) => {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: "default",
      body: "This is a test notification",
      data: {
        withSome: "data",
      },
    });
  });

  let chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
    } catch (error) {
      console.error(error);
      return new Response(`error sending notification: ${error}`, { status: 500 });
    }
  }

  return new Response("notifications sent");
}
