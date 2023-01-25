import React, { useEffect, useRef, useState } from "react";
import { Button, Platform, Text, View } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const App: React.FC = () => {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotifications().then(token => setExpoPushToken(token ?? ""));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleSendNotification = async () => {
    const localhost = Constants.manifest?.debuggerHost?.split(":").shift();
    if (!localhost) {
      throw new Error("Failed to get localhost, configure it manually!");
    }

    await fetch(`http://${localhost}:3001/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: expoPushToken }),
    });
  };

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>expo-push-worker</Text>
      <Text>
        Token: {expoPushToken ?? "none"}
      </Text>
      <View style={{ flexDirection: "row" }}>
        <View style={{ margin: 4 }}>
          <Button
            title={"send"}
            onPress={handleSendNotification}
            disabled={!expoPushToken || !!notification}
          />
        </View>
        <View style={{ margin: 4 }}>
          <Button
            title={"clear"}
            onPress={() => setNotification(null)}
            disabled={!notification}
            color={"red"}
          />
        </View>
      </View>
      <Text>
        Notification: {notification ? JSON.stringify(notification, null, 2) : "none"}
      </Text>
    </View>
  );
};

export default App;

const registerForPushNotifications = async () => {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}
