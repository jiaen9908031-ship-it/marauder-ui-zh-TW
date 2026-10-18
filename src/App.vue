<template>
  <div class="h-screen flex flex-col bg-yellow-50 p-4 gap-4">
    <MobileBlocker />

    <!-- Header -->
    <div
      class="bg-pink-400 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex justify-between items-center">
      <h1 class="text-3xl font-black">marauder-ui</h1>
      <div class="flex items-center space-x-4">
        <!-- Demo Mode Button -->
        <button v-if="!serialConnection.isConnected.value" @click="toggleDemoMode"
          class="px-3 py-1 text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          :class="isDemoMode ? 'bg-purple-500 text-white' : 'bg-white'">
          {{ isDemoMode ? '離開示範模式' : '試用示範模式' }}
        </button>

        <span class="text-sm">狀態：</span>
        <button @click="handleConnect" v-if="!serialConnection.isConnected.value"
          class="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          連線
        </button>
        <button @click="handleDisconnect" v-if="serialConnection.isConnected.value"
          class="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
          中斷連線
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Left Sidebar -->
      <div class="w-1/4 flex flex-col gap-4">
        <!-- Command Builder -->
        <div class="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
          <CommandBuilder />
        </div>

        <!-- Workflows -->
        <div
          class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 overflow-auto">
          <h2 class="text-xl font-bold mb-4">工作流程</h2>
          <div class="space-y-2">
            <button v-for="workflow in workflows" :key="workflow.id" @click="openWorkflow(workflow)"
              class="w-full px-3 py-2 text-left text-sm bg-gray-100 hover:bg-gray-200 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              {{ workflow.name }}
            </button>
          </div>
        </div>
      </div>


      <!-- Right Content -->
      <div class="flex-1 flex flex-col gap-4">
        <!-- APs List -->
        <div
          class="flex-1 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 min-h-0">
          <AccessPointTable />
        </div>
      </div>
    </div>

    <!-- Terminal Output -->
    <div class="h-64 bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
      <TerminalOutput />
    </div>
  </div>

  <Teleport to="body">
    <WorkflowDialog v-if="selectedWorkflow" :workflow="selectedWorkflow" @close="selectedWorkflow = null"
      @execute="executeWorkflow" />
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import MobileBlocker from './components/MobileBlocker.vue'
import CommandBuilder from './components/CommandBuilder.vue'
import TerminalOutput from './components/TerminalOutput.vue'
import AccessPointTable from './components/AccessPointTable.vue'
import WorkflowDialog from './components/WorkflowDialog.vue'
import { useSerialConnection } from './utils/serialConnection'
import { generateDemoData, generateDemoTerminalOutput } from './utils/demoData'
const isDemoMode = ref(false)
const demoUpdateInterval = ref(null)

// Add mobile detection
const isMobileDevice = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
  }

  // Check on mount
  checkMobile()

  // Check on resize
  window.addEventListener('resize', checkMobile)

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('resize', checkMobile)
  })
})

const serialConnection = useSerialConnection()
const selectedWorkflow = ref(null)
const workflows = [
  {
    id: 'random-beacon-spam-list',
    name: '隨機 Beacon 廣播（清單）',
    description: '產生隨機 SSID 清單，並使用此清單廣播 Beacon 封包。',
    steps: [
      { command: 'ssid -a -g 50', description: '產生 50 個隨機 SSID' },
      { command: 'list -s', description: '顯示產生的 SSID' },
      { command: 'attack -t beacon -l', description: '執行清單式 Beacon 廣播' }
    ]
  },
  {
    id: 'random-beacon-spam-auto',
    name: '隨機 Beacon 廣播（自動）',
    description: '自動產生隨機 SSID，並廣播 Beacon 封包。',
    steps: [
      { command: 'attack -t beacon -r', description: '執行隨機 Beacon 廣播' }
    ]
  },
  {
    id: 'targeted-pmkid-sniff',
    name: '指定目標主動 PMKID 嗅探',
    description: '針對選取的無線基地台進行 PMKID 嗅探。',
    steps: [
      { command: 'scanap', description: '掃描無線基地台' },
      { command: 'list -a', description: '列出可用的無線基地台' },
      {
        command: 'select -a {targets}',
        description: '選取目標無線基地台',
        requiresInput: true,
        inputLabel: '目標 AP 編號（以逗號分隔）',
        placeholder: '0,1,2'
      },
      { command: 'list -a', description: '確認已選取的無線基地台' },
      { command: 'sniffpmkid -d -l', description: '執行指定目標 PMKID 嗅探' }
    ]
  },
  {
    id: 'random-beacon-spam-list',
    name: '隨機 Beacon 廣播（清單）',
    description: '產生隨機 SSID 清單，並使用此清單廣播 Beacon 封包。',
    steps: [
      { command: 'ssid -a -g 50', description: '產生 50 個隨機 SSID' },
      { command: 'list -s', description: '顯示產生的 SSID' },
      { command: 'attack -t beacon -l', description: '執行清單式 Beacon 廣播' }
    ]
  },
  {
    id: 'list-beacon-spam',
    name: '清單式 Beacon 廣播',
    description: '建立自訂 SSID 清單，並使用此清單廣播 Beacon 封包。',
    steps: [
      {
        command: 'ssid -a -{type} {value}',
        description: '將 SSID 加入清單',
        requiresInput: true,
        inputLabel: 'SSID 產生方式',
        placeholder: 'g 3 或 n MySSID',
        help: '輸入「g 數量」產生隨機 SSID，或輸入「n 名稱」指定 SSID'
      },
      { command: 'list -s', description: '顯示產生的 SSID' },
      { command: 'attack -t beacon -l', description: '執行清單式 Beacon 廣播' }
    ]
  },
  {
    id: 'ap-clone-spam',
    name: 'AP 仿冒廣播',
    description: '複製附近的 AP，並以稍作修改的名稱重新廣播。',
    steps: [
      { command: 'scanap', description: '掃描無線基地台' },
      { command: 'list -a', description: '列出可用的無線基地台' },
      {
        command: 'select -a {targets}',
        description: '選取目標無線基地台',
        requiresInput: true,
        inputLabel: '目標 AP 編號（以逗號分隔）',
        placeholder: '0,1,2'
      },
      { command: 'list -a', description: '確認已選取的無線基地台' },
      { command: 'attack -t beacon -a', description: '執行 AP 仿冒廣播' }
    ]
  },
  {
    id: 'deauth-flood',
    name: '解除驗證封包洪泛',
    description: '向所選 AP 的所有用戶端廣播解除驗證封包。',
    steps: [
      { command: 'scanap', description: '掃描無線基地台' },
      { command: 'list -a', description: '列出可用的無線基地台' },
      {
        command: 'select -a {targets}',
        description: '選取目標無線基地台',
        requiresInput: true,
        inputLabel: '目標 AP 編號（以逗號分隔）',
        placeholder: '0,1'
      },
      { command: 'list -a', description: '確認已選取的無線基地台' },
      { command: 'attack -t deauth', description: '執行解除驗證封包洪泛' }
    ]
  },
  {
    id: 'targeted-deauth',
    name: '指定目標解除驗證',
    description: '針對連線至所選 AP 的特定用戶端執行操作。',
    steps: [
      { command: 'scanap', description: '掃描無線基地台' },
      { command: 'list -a', description: '列出可用的無線基地台' },
      {
        command: 'select -a {apTargets}',
        description: '選取目標無線基地台',
        requiresInput: true,
        inputLabel: '目標 AP 編號（以逗號分隔）',
        placeholder: '0,1'
      },
      { command: 'list -a', description: '確認已選取的無線基地台' },
      { command: 'scansta', description: '掃描用戶端' },
      { command: 'list -c', description: '列出可用的用戶端' },
      {
        command: 'select -c {staTargets}',
        description: '選取目標用戶端',
        requiresInput: true,
        inputLabel: '目標用戶端編號（以逗號分隔）',
        placeholder: '0,12'
      },
      { command: 'list -c', description: '確認已選取的用戶端' },
      { command: 'attack -t deauth -c', description: '執行指定目標解除驗證' }
    ]
  },
  {
    id: 'manual-deauth',
    name: '手動解除驗證',
    description: '手動指定解除驗證封包的來源與目的 MAC 位址。',
    steps: [
      {
        command: 'attack -t deauth -s {source} -d {dest}',
        description: '執行手動解除驗證',
        requiresInput: true,
        inputLabel: '來源 MAC 位址',
        placeholder: '00:00:00:00:00:00',
        requiresSecondInput: true,
        secondInputLabel: '目的 MAC 位址',
        secondPlaceholder: 'ff:ff:ff:ff:ff:ff'
      }
    ]
  },
  {
    id: 'signal-monitor',
    name: '訊號監控',
    description: '監控所選無線基地台的訊號強度。',
    steps: [
      { command: 'scanap', description: '掃描無線基地台' },
      { command: 'list -a', description: '列出可用的無線基地台' },
      {
        command: 'select -a {targets}',
        description: '選取目標無線基地台',
        requiresInput: true,
        inputLabel: '目標 AP 編號（以逗號分隔）',
        placeholder: '0,1'
      },
      { command: 'list -a', description: '確認已選取的無線基地台' },
      { command: 'sigmon', description: '開始監控訊號' }
    ]
  }
]

const openWorkflow = (workflow) => {
  console.log('Opening workflow:', workflow) // Debug log
  selectedWorkflow.value = workflow
}

const executeWorkflow = async (commands) => {
  console.log('Executing commands:', commands) // Debug log
  for (const command of commands) {
    await serialConnection.sendCommand(command)
    // Add small delay between commands
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  selectedWorkflow.value = null
}

const handleConnect = async () => {
  console.log('Attempting to connect...')
  try {
    await serialConnection.connect()
  } catch (error) {
    console.error('Connection error:', error)
  }
}

const handleDisconnect = async () => {
  console.log('Attempting to disconnect...')
  try {
    await serialConnection.disconnect()
  } catch (error) {
    console.error('Disconnection error:', error)
  }
}

const sendCommand = async (cmd) => {
  try {
    await serialConnection.sendCommand(cmd)
  } catch (error) {
    console.error('Command error:', error)
  }
}

const toggleDemoMode = () => {
  isDemoMode.value = !isDemoMode.value

  serialConnection.isDemoMode = isDemoMode.value
  if (isDemoMode.value) {
    // Initialize demo data
    serialConnection.terminalOutput.value = generateDemoTerminalOutput()
  } else {
    // Clear demo data
    clearInterval(demoUpdateInterval.value)
    serialConnection.terminalOutput.value = []
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  if (demoUpdateInterval.value) {
    clearInterval(demoUpdateInterval.value)
  }
})
</script>

<style>
.workflow-dialog {
  z-index: 9999;
}
</style>