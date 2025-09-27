import mqtt from 'mqtt';

/**
 * MQTTService Class
 * Membungkus semua logika koneksi, subscribing, dan publishing MQTT.
 * Menggunakan pola callback untuk berkomunikasi kembali dengan komponen UI.
 */
export class MQTTService {
  constructor(brokerUrl, options, callbacks = {}) {
    this.client = null;
    this.brokerUrl = brokerUrl;
    this.options = options;
    this.callbacks = callbacks; // { onConnect, onMessage, onClose, onError }
  }

  connect() {
    console.log(`🔌 MQTT Service: Connecting to ${this.brokerUrl}`);
    this.client = mqtt.connect(this.brokerUrl, this.options);

    this.client.on('connect', () => {
      console.log('✅ MQTT Service: Connected!');
      this.callbacks.onConnect?.();
    });

    this.client.on('message', (topic, payload) => {
      this.callbacks.onMessage?.(topic, payload);
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Service Error:', err);
      this.callbacks.onError?.(err);
      this.client.end();
    });

    this.client.on('close', () => {
      console.log(' MQTT Service: Disconnected.');
      this.callbacks.onClose?.();
    });
  }

  publish(topic, message, options = { qos: 1, retain: false }) {
    if (this.client && this.client.connected) {
      console.log(`🚀 Publishing to ${topic}:`, message);
      this.client.publish(topic, message, options, (err) => {
        if (err) {
          console.error(`❌ Failed to publish to topic ${topic}:`, err);
        }
      });
    } else {
      console.error('MQTT Client is not connected. Cannot publish.');
    }
  }

  subscribe(topic, options = { qos: 0 }) {
    if (this.client) {
      this.client.subscribe(topic, options, (err) => {
        if (err) {
          console.error(`Failed to subscribe to topic ${topic}:`, err);
        } else {
          console.log(`Subscribed to topic: ${topic}`);
        }
      });
    }
  }

  disconnect() {
    if (this.client) {
      console.log(' MQTT Service: Disconnecting...');
      this.client.end();
    }
  }
}