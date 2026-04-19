import Expo, { ExpoPushMessage } from "expo-server-sdk";
import { db, usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const expo = new Expo();

export async function sendPushNotifications(
  userIds: string[],
  notification: { title: string; body: string; data?: object }
) {
  if (userIds.length === 0) return;

  const users = await db.select({ pushToken: usersTable.pushToken })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));

  const tokens = users
    .map(u => u.pushToken)
    .filter((t): t is string => !!t && Expo.isExpoPushToken(t));

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map(token => ({
    to: token,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data ?? {},
  }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (_) {}
  }
}
