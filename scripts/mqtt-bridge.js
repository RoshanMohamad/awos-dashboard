// MQTT -> HTTP bridge
// Listens to an MQTT topic and forwards messages (expected JSON) to the backend ingest endpoint.
// Usage:
// 1) npm install mqtt
// 2) set env vars (optional): MQTT_BROKER_URL, MQTT_TOPIC, INGEST_URL
// 3) node scripts/mqtt-bridge.js

const mqtt = require('mqtt')

// Configuration via environment variables
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'awos/readings/#'
const INGEST_URL = process.env.INGEST_URL || 'http://localhost:3000/api/ingest'
const CLIENT_ID = process.env.MQTT_CLIENT_ID || `awos-bridge-${Math.random().toString(16).slice(2, 8)}`

// Concurrency and retry settings
const MAX_CONCURRENT = parseInt(process.env.MQTT_BRIDGE_CONCURRENCY || '1', 10)
const RETRY_COUNT = parseInt(process.env.MQTT_BRIDGE_RETRY || '3', 10)
const RETRY_DELAY_MS = parseInt(process.env.MQTT_BRIDGE_RETRY_DELAY_MS || '2000', 10)

console.log('Starting MQTT -> HTTP bridge')
console.log({ MQTT_BROKER_URL, MQTT_TOPIC, INGEST_URL, CLIENT_ID })

const client = mqtt.connect(MQTT_BROKER_URL, {
	clientId: CLIENT_ID,
	reconnectPeriod: 5000,
})

let running = true

// Simple FIFO queue to avoid flooding the ingest endpoint
const queue = []
let active = 0

async function postWithRetries(body, retries = RETRY_COUNT) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const res = await fetch(INGEST_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})

			if (!res.ok) {
				const text = await res.text().catch(() => '')
				throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`)
			}

			return await res.json().catch(() => null)
		} catch (err) {
			console.warn(`Post attempt ${attempt} failed:`, String(err))
			if (attempt < retries) {
				await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
				continue
			}
			throw err
		}
	}
}

async function worker() {
	if (active >= MAX_CONCURRENT) return
	if (queue.length === 0) return
	active++
	const item = queue.shift()
	try {
		await postWithRetries(item)
		console.log('Forwarded message to ingest endpoint')
	} catch (err) {
		console.error('Failed to forward message after retries:', err)
	} finally {
		active--
		// schedule next
		setImmediate(worker)
	}
}

client.on('connect', () => {
	console.log('Connected to MQTT broker')
	client.subscribe(MQTT_TOPIC, { qos: 0 }, (err, granted) => {
		if (err) {
			console.error('Subscribe error', err)
			return
		}
		console.log('Subscribed to', MQTT_TOPIC, 'granted:', granted.map(g => g.topic).join(', '))
	})
})

client.on('reconnect', () => console.log('Reconnecting to MQTT broker...'))
client.on('close', () => console.log('MQTT connection closed'))
client.on('error', (err) => console.error('MQTT error', err))

client.on('message', (topic, payloadBuffer) => {
	if (!running) return
	const payloadStr = payloadBuffer.toString()
	let parsed
	try {
		parsed = JSON.parse(payloadStr)
	} catch (err) {
		// Not JSON — wrap raw payload
		parsed = { raw: payloadStr }
	}

	// Attach metadata
	const message = {
		topic,
		receivedAt: new Date().toISOString(),
		payload: parsed,
	}

	// Enqueue and trigger worker
	queue.push(message)
	setImmediate(worker)
})

// Graceful shutdown
function shutdown() {
	if (!running) return
	running = false
	console.log('Shutting down MQTT bridge...')
	client.end(false, () => {
		console.log('MQTT client disconnected')
		// attempt to flush queue briefly
		const flushInterval = setInterval(() => {
			if (queue.length === 0 || active === 0) {
				clearInterval(flushInterval)
				console.log('Queue flushed, exiting')
				process.exit(0)
			}
		}, 500)
		// force exit after 5s
		setTimeout(() => process.exit(0), 5000)
	})
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// If the runtime doesn't provide fetch (Node <18), warn the user
if (typeof fetch !== 'function') {
	console.warn('Global fetch() is not available in this Node runtime. If running Node <18, install node-fetch and adjust the script.')
}

module.exports = { }
