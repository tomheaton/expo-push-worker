import { Expo, type ExpoPushMessage } from "expo-server-sdk";

type EnvType = {
  EXPO_ACCESS_TOKEN: string;
}

export default {
  async fetch(request: Request, env: EnvType) {
    if (request.url.endsWith("/send") && request.method === "POST") {
      return await handleSend(request, env);
    }

    if (request.url.endsWith("/messages") && request.method === "POST") {
      return await handleMessages(request, env);
    }

    if (request.url.endsWith("/token") && request.method === "POST") {
      return await handleToken(request);
    }

    return JsonResponse({ success: true, message: `request method: ${request.method}` });
  },
};

const handleSend = async (request: Request, env: EnvType) => {
  if (request.headers.get("content-type") !== "application/json") {
    return JsonResponse({ success: false, message: "invalid content-type" });
  }

  const data: any = await request.json();
  if (!data || !data.token) {
    return JsonResponse({ success: false, message: "token not provided" });
  }

  let pushToken = data.token;
  console.log("pushToken:", pushToken);

  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  let expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });

  // Create the messages that you want to send to clients
  let messages: ExpoPushMessage[] = [];

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

  let chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  return JsonResponse({ success: true, message: "notification sent" });
};

const handleMessages = async (request: Request, env: EnvType) => {
  if (request.headers.get("content-type") !== "application/json") {
    return JsonResponse({ success: false, message: "invalid content-type" });
  }

  const data: any = await request.json();
  if (!data || !data.tokens || !data.tokens.length) {
    return JsonResponse({ success: false, message: "tokens not provided" });
  }

  let pushTokens = data.tokens;
  console.log("pushTokens:", pushTokens);

  // Create a new Expo SDK client
  // optionally providing an access token if you have enabled push security
  let expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN });

  // Create the messages that you want to send to clients
  let messages: ExpoPushMessage[] = [];

  pushTokens.forEach((pushToken: unknown) => {
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
    }
  }

  return JsonResponse({ success: true, message: "notifications sent" });
};

const handleToken = async (request: Request) => {
  if (request.headers.get("content-type") !== "application/json") {
    return JsonResponse({ success: false, message: "invalid content-type" });
  }

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
