<template>
    <div class="command-group">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <button @click="emitCommand('list -s')" class="command-btn">
            列出用戶端
          </button>
          <button @click="emitCommand('list -a')" class="command-btn">
            列出 AP
          </button>
          <button @click="emitCommand('list -c')" class="command-btn">
            列出已擷取資料
          </button>
          <button @click="emitCommand('clearlist -a')" class="command-btn bg-red-500 hover:bg-red-600">
            全部清除
          </button>
        </div>
  
        <div class="bg-white p-4 rounded-lg border-2 border-black mt-3">
          <h3 class="font-bold mb-2">篩選選項</h3>
          <div class="space-y-3">
            <input v-model="filterText" type="text" class="input-field" placeholder="輸入篩選文字">
            <select v-model="filterType" class="input-field">
              <option value="a">無線基地台</option>
              <option value="s">用戶端</option>
              <option value="c">已擷取資料</option>
            </select>
            <button @click="buildFilterCommand" class="command-btn w-full">
              套用篩選
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const emit = defineEmits(['command-built'])
  const filterText = ref('')
  const filterType = ref('a')
  
  const emitCommand = (command) => {
    emit('command-built', command)
  }
  
  const buildFilterCommand = () => {
    if (!filterText.value) return
    const cmd = `select -${filterType.value} -f "${filterText.value}"`
    emit('command-built', cmd)
  }
  </script>