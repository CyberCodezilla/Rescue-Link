# RescueLink Satellite / LoRa Uplink

RescueLink now has a provider-agnostic satellite uplink path for compact emergency packets. The implementation does not pretend to provide a proprietary Starlink or Iridium modem API. A real satellite modem or gateway publishes the packet to the configured AWS IoT MQTT topic, while the HTTP endpoint is available for a gateway that forwards packets over HTTPS.

## End-to-end flow

```text
Satellite / LoRa modem
        |
        | <= 100-byte binary packet
        v
AWS IoT Core MQTT
        |
        v
SatelliteIngestFunction (Lambda)
        |
        +--> DynamoDB idempotent incident write
        |
        +--> Step Functions
        |      +--> Bedrock triage
        |      +--> SNS / SES
        |      +--> SSE callback
        |
        +--> telemetry acknowledgement

Gateway alternative:
Satellite gateway -> POST /api/satellite/uplink -> RescueLink API
```

AWS IoT rules support MQTT-driven routing to Lambda, and the Lambda action requires a resource-based permission for AWS IoT. The SAM template creates both the topic rule and permission.

## Wire packet

The binary packet is 93 bytes and is therefore below the 100-byte uplink budget. It contains:

- magic and protocol version
- UUID packet ID for idempotency
- device ID
- Unix timestamp
- latitude and longitude at microdegree precision
- SOS or telemetry type
- disaster category / sensor metric
- affected-person count
- urgent-needs bitmask
- compact UTF-8 description
- sensor value
- CRC32 integrity check

Any packet larger than 100 bytes, malformed, tampered, or using an unsupported version is rejected.

## HTTP gateway API

`POST /api/satellite/uplink`

Required header:

```text
x-satellite-api-key: <SATELLITE_API_KEY>
```

Example request:

```json
{
  "provider": "generic",
  "packetBase64": "<93-byte-packet-as-base64>",
  "receivedAt": 1789742000000,
  "signalStrength": -83
}
```

Responses:

- `202` new SOS or telemetry packet accepted
- `200` duplicate SOS packet accepted idempotently
- `400` malformed or CRC-invalid packet
- `401` invalid satellite API key
- `503` satellite HTTP ingress is not configured

## AWS IoT path

The SAM stack creates an IoT rule for:

```text
rescuelink/satellite/+/uplink
```

Publish the same JSON envelope used by the HTTP endpoint. AWS IoT passes the message to `SatelliteIngestFunction`. The Lambda validates the compact packet, creates an SOS incident with a deterministic `sat-<packetId>` ID, and starts the existing Step Functions workflow. Duplicate packet IDs are ignored safely.

## Local validation

No satellite provider credentials or physical modem are required for the automated tests. The codec, CRC validation, API authentication, idempotency, SOS conversion, telemetry path, and Lambda normalization are tested locally.

A real satellite provider still requires its own modem/gateway, credentials, network subscription, and provider-specific transport configuration. Those credentials are intentionally not embedded in the repository.
