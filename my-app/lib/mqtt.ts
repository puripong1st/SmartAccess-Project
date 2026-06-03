import mqtt from "mqtt";

const MQTT_BROKER_HOST = process.env.MQTT_BROKER_HOST || "xxxxxx.s1.eu.hivemq.cloud";
const MQTT_USERNAME = process.env.MQTT_USERNAME || "esp32_client";
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || "your_secure_password";
const MQTT_PORT = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT, 10) : 8084;
const MQTT_PATH = process.env.MQTT_PATH || "/mqtt";

/**
 * Publishes a message to the MQTT Broker over secure WebSockets.
 * Optimized for serverless edge functions: connects, publishes, and closes quickly.
 */
export async function publishMqttMessage(
  topic: string,
  message: string
): Promise<boolean> {
  return new Promise((resolve) => {
    // Connect using WebSockets (wss://) suitable for serverless edge runtimes
    const brokerUrl = `wss://${MQTT_BROKER_HOST}:${MQTT_PORT}${MQTT_PATH}`;
    
    console.log(`[MQTT Backend] Connecting to ${brokerUrl}...`);
    const client = mqtt.connect(brokerUrl, {
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      rejectUnauthorized: false, // Avoid SSL certification verification issues on serverless
      connectTimeout: 4000,
    });

    let resolved = false;

    client.on("connect", () => {
      console.log(`[MQTT Backend] Connected! Publishing to ${topic}...`);
      client.publish(topic, message, { qos: 1 }, (err: Error | null | undefined) => {
        if (err) {
          console.error(`[MQTT Backend] Publish error:`, err);
          if (!resolved) {
            resolved = true;
            client.end();
            resolve(false);
          }
        } else {
          console.log(`[MQTT Backend] Published successfully!`);
          if (!resolved) {
            resolved = true;
            client.end();
            resolve(true);
          }
        }
      });
    });

    client.on("error", (err: Error) => {
      console.error(`[MQTT Backend] Connection error:`, err);
      if (!resolved) {
        resolved = true;
        client.end();
        resolve(false);
      }
    });

    // Timeout fallback (prevents edge execution hanging)
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`[MQTT Backend] Publish timeout.`);
        client.end(true);
        resolve(false);
      }
    }, 4500);
  });
}
