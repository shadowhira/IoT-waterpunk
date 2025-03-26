import paho.mqtt.client as mqtt
import json
import time
import random

# Thông tin MQTT Broker
MQTT_BROKER = "192.168.43.204"  # Đổi thành địa chỉ thực tế của bạn
MQTT_PORT = 2403
MQTT_TOPIC_DATA = "/sensor/data"
MQTT_TOPIC_CONTROL = "/sensor/control"
MQTT_TOPIC_LEVEL = "/sensor/level"

client = mqtt.Client("FakeSensorClient")

# Kết nối tới MQTT broker
client.connect(MQTT_BROKER, MQTT_PORT, 60)

def send_fake_sensor_data():
    """Gửi dữ liệu giả lập từ cảm biến đến MQTT Broker."""
    data = {
        "temperature": round(random.uniform(20.0, 40.0), 1),
        "tds": round(random.uniform(100.0, 600.0), 1),
        "flowRate": round(random.uniform(0.0, 5.0), 1),
        "distance": round(random.uniform(0.0, 15.0), 1),
        "pumpState": random.choice([0, 1]),
        "currentLevelPercent": round(random.uniform(10.0, 100.0), 1),
    }
    payload = json.dumps(data)
    client.publish(MQTT_TOPIC_DATA, payload)
    print("Gửi dữ liệu:", payload)

def send_fake_command():
    """Gửi lệnh điều khiển ngẫu nhiên."""
    command = random.choice(["on", "off", "auto"])
    client.publish(MQTT_TOPIC_CONTROL, command)
    print("Gửi lệnh điều khiển:", command)

def send_fake_level():
    """Gửi mức nước mong muốn ngẫu nhiên."""
    level = str(random.randint(30, 100))
    client.publish(MQTT_TOPIC_LEVEL, level)
    print("Gửi mức nước mong muốn:", level)

# Gửi dữ liệu giả lập mỗi 2 giây
try:
    while True:
        send_fake_sensor_data()
        if random.random() > 0.7:  # 30% cơ hội gửi lệnh điều khiển
            send_fake_command()
        if random.random() > 0.7:  # 30% cơ hội gửi mức nước mong muốn
            send_fake_level()
        time.sleep(2)
except KeyboardInterrupt:
    print("Dừng chương trình giả lập.")
    client.disconnect()
