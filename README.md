<div align="center">

![AgriRover Banner](assets/agrirover_banner.svg)

# 📡 AgriRover-IoT: Autonomous Agricultural Telemetry Pipeline
### *Edge Sensor Ingestion, Microcontroller Firmware & Precision Irrigation Cloud Dashboard*

[![Hardware: ESP8266 / Arduino](https://img.shields.io/badge/Hardware-ESP8266_%7C_Arduino-00979D?style=flat-square&logo=arduino&logoColor=white)](https://github.com/Jaswanth1902/iot_el_1)
[![Firmware: C++](https://img.shields.io/badge/Firmware-C++_%7C_Embedded-00599C?style=flat-square&logo=c%2B%2B&logoColor=white)](https://github.com/Jaswanth1902/iot_el_1)
[![Cloud: Realtime Telemetry](https://img.shields.io/badge/Cloud-Firebase_%7C_REST-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://github.com/Jaswanth1902/iot_el_1)
[![License: MIT](https://img.shields.io/badge/License-MIT-C5A059.svg?style=flat-square)](LICENSE)

*An autonomous agricultural rover and edge sensing pipeline streaming soil moisture, ambient humidity, and obstacle telemetry to live monitoring dashboards.*

</div>

---

## ⚡ The Architectural Vision

Smallholder agriculturalists frequently lack affordable, real-time soil moisture and microclimate telemetry, leading to wasteful over-irrigation or catastrophic crop desiccation. Commercial ag-tech systems cost thousands and depend on proprietary, locked clouds.

**AgriRover-IoT** delivers an accessible, open-hardware telemetry solution:
- **Autonomous Navigation**: Ultrasonic obstacle avoidance guiding rover traversal across rough terrain.
- **Multimodal Soil Telemetry**: Capacitive soil moisture, DHT11 ambient temperature/humidity, and light intensity probes.
- **Resilient Edge Ingestion**: ESP8266 microcontroller streaming telemetry packets over Wi-Fi with local offline caching.

---

## 🏗️ Telemetry Data Pipeline

```mermaid
flowchart TD
    subgraph RoverSensors["Physical Sensor Array"]
        Moist["Capacitive Soil Moisture Probe"]
        DHT["DHT11 Temp / Humidity Sensor"]
        Sonar["HC-SR04 Ultrasonic Obstacle Detector"]
    end

    subgraph MCU["Edge Microcontroller (ESP8266 / Arduino)"]
        Moist & DHT & Sonar --> Firmware["C++ Telemetry Firmware
(Sensor Calibration & Low-Pass Filter)"]
        Firmware --> Nav["Kinetic Obstacle Avoidance Loop
(L298N Motor Driver)"]
        Firmware --> WiFI["ESP-WiFi Telemetry Broadcaster"]
    end

    subgraph CloudAnalytics["Cloud & Telemetry Sink"]
        WiFI -->|HTTPS REST JSON| CloudDB[(Firebase / MQTT Broker)]
        CloudDB --> WebUI["Mobile & Desktop Precision Agriculture HUD"]
    end
```

---

## 🧩 Antigravity Skills & Tooling

- **`performance-profiling`**: Microsecond loop execution bounds preventing motor stall conditions.
- **`systematic-debugging`**: Signal filtering eliminating analog ADC noise on capacitive moisture probes.
- **`diagram-design`**: Full hardware schematics and telemetry flow.

---

## 📦 Hardware & Dependencies

- **Microcontroller**: ESP8266 NodeMCU / Arduino Uno
- **Sensors**: Capacitive Moisture Sensor v1.2, DHT11, HC-SR04
- **Actuators**: L298N Dual H-Bridge Motor Driver, 4x DC Geared Motors
- **Libraries**: `ESP8266WiFi.h`, `FirebaseArduino.h`, `DHT.h`

---

## 🛡️ Security & Reliability

1. **Offline Telemetry Buffering**: Sensors log to internal EEPROM when Wi-Fi connection is dropped.
2. **Watchdog Timer**: Automated hardware watchdog reset prevents microcontroller hangs in outdoor field environments.
3. **Sanitized REST Payload**: Payload boundaries prevent buffer overruns on low-memory SRAM.

---

## 📄 License

Distributed under the [MIT License](LICENSE). Maintained by [Jaswanth Reddy](https://github.com/Jaswanth1902) — *Passionate learner & creative problem solver learning from and giving back to the open-source community.*
