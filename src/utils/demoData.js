// src/utils/demoData.js
const VENDORS = ['Cisco', 'TP-Link', 'Netgear', 'D-Link', 'Asus', 'Linksys', 'Ubiquiti']
const SSID_PREFIXES = ['Home-', 'WiFi-', 'Network-', 'Guest-', 'Office-', 'IoT-']

function generateMAC() {
    return Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase()
}

function generateSSID() {
    const prefix = SSID_PREFIXES[Math.floor(Math.random() * SSID_PREFIXES.length)]
    const suffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
    return `${prefix}${suffix}`
}

function generateRSSI() {
    return -(Math.floor(Math.random() * 60) + 30) // -30 to -90
}

function generateChannel() {
    return Math.floor(Math.random() * 13) + 1 // 1-13
}

export function generateDemoData() {
    const apCount = 10 + Math.floor(Math.random() * 10) // 10-20 APs
    const aps = []

    for (let i = 0; i < apCount; i++) {
        const ap = {
            index: i,
            bssid: generateMAC(),
            essid: generateSSID(),
            rssi: generateRSSI(),
            channel: generateChannel(),
            isHidden: Math.random() < 0.1,
            isSelected: Math.random() < 0.2,
            lastSeen: new Date(),
            stations: []
        }

        // Add random stations (0-5 per AP)
        const stationCount = Math.floor(Math.random() * 6)
        for (let j = 0; j < stationCount; j++) {
            ap.stations.push({
                id: j,
                mac: generateMAC(),
                vendor: VENDORS[Math.floor(Math.random() * VENDORS.length)],
                lastSeen: new Date(Date.now() - Math.random() * 3600000) // Up to 1 hour ago
            })
        }

        aps.push(ap)
    }

    return aps
}

export function generateDemoTerminalOutput() {
    return [
        '<span class="text-blue-400">✓ 已連線至序列埠</span>',
        '<span class="text-green-400">> scanap</span>',
        '<span class="text-green-400">開始掃描 AP。輸入 stopscan 可停止掃描</span>',
        '<span class="text-green-400">正在清除 AP……0</span>',
        ...generateDemoData().map(ap =>
            `<span class="text-green-400">RSSI: ${ap.rssi} Ch: ${ap.channel} BSSID: ${ap.bssid} ESSID: ${ap.essid}</span>`
        ),
        '<span class="text-green-400">> list -a</span>',
        ...generateDemoData().map(ap =>
            `<span class="text-green-400">[${ap.index}][CH:${ap.channel}] ${ap.essid}</span>`
        )
    ]
}