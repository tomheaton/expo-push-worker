import { Expo, type ExpoPushMessage } from "expo-server-sdk";

declare global {
  const EXPO_ACCESS_TOKEN: string;
  const DEVICE_TOKEN: string;
}

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo({ accessToken: "EXPO_ACCESS_TOKEN" });

export default {
  async fetch(request: Request, env: any) {
    console.log(env);
    if (request.url.endsWith("/send") && request.method === "POST") {
      return await handlePushNotifications();
    }

    if (request.url.endsWith("/token") && request.method === "POST") {
      return await handlePushToken(request);
    }

    return JsonResponse({ success: true, message: `request method: ${request.method}` });
  },
};

const handlePushNotifications = async () => {
  // Create the messages that you want to send to clients
  let messages: ExpoPushMessage[] = [];
  // let pushTokens = ["ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"];
  let pushTokens = ["DEVICE_TOKEN"];
  console.log(`pushTokens: ${pushTokens}`);

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
      // return JsonResponse({ success: true, message: `error sending notification: ${error}`, status: 500 });
    }
  }

  return JsonResponse({ success: true, message: "notifications sent" });
};

const handlePushToken = async (request: Request) => {
  // TODO: fix error handling here
  const data: any = await request.json();
  if (!data || !data.token) {
    return JsonResponse({ success: false, message: "token not provided" });
  }

  if (!Expo.isExpoPushToken(data.token)) {
    console.error(`Push token ${data.token} is not a valid Expo push token`);
    return JsonResponse({ success: false, message: "invalid token received" });
  }

  console.log(`token: ${data.token}`);
  return JsonResponse({ success: true, message: "valid token received" });
};

const JsonResponse = (response: { success: boolean, message: string, data?: any, status?: number }) => {
  return new Response(JSON.stringify(response), {
    headers: { "content-type": "application/json" },
    status: response.status ?? response.success ? 200 : 400,
  });
};
