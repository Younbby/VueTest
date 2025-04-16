<template>
  <div id="app">
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>对话列表</h2>
        <button class="new-chat-btn" @click="startNewChat">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          新对话
        </button>
      </div>
      <div class="chat-history">
        <!-- 置顶对话分组 -->
        <div v-if="pinnedChats.length > 0" class="chat-group">
          <div class="group-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8l-2 2v2h5.2v6h1.6v-6H17v-2l-1-1z"/>
            </svg>
            置顶对话
          </div>
          <div v-for="(chat, index) in pinnedChats" 
               :key="'pinned-' + index" 
               :class="['chat-item', { active: currentChatIndex === getChatIndex(chat) }]"
               @click="switchChat(getChatIndex(chat))">
            <div class="chat-item-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <span class="chat-title">{{ chat.title || '新对话' }}</span>
            </div>
            <div class="chat-item-actions">
              <button class="more-btn" @click.stop="showOptions(getChatIndex(chat))">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <div v-if="chat.showOptions" class="options-menu" @click.stop>
                <button @click="pinChat(getChatIndex(chat))" :class="{ 'pinned': chat.pinned }">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8l-2 2v2h5.2v6h1.6v-6H17v-2l-1-1z"/>
                  </svg>
                  {{ chat.pinned ? '取消置顶' : '置顶' }}
                </button>
                <button @click="renameChat(getChatIndex(chat))">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  重命名
                </button>
                <button @click="deleteChat(getChatIndex(chat))" class="delete-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- 普通对话分组 -->
        <div v-if="unpinnedChats.length > 0" class="chat-group">
          <div class="group-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            全部对话
          </div>
          <div v-for="(chat, index) in unpinnedChats" 
               :key="'unpinned-' + index" 
               :class="['chat-item', { active: currentChatIndex === getChatIndex(chat) }]"
               @click="switchChat(getChatIndex(chat))">
            <div class="chat-item-content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
              <span class="chat-title">{{ chat.title || '新对话' }}</span>
            </div>
            <div class="chat-item-actions">
              <button class="more-btn" @click.stop="showOptions(getChatIndex(chat))">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
              <div v-if="chat.showOptions" class="options-menu" @click.stop>
                <button @click="pinChat(getChatIndex(chat))" :class="{ 'pinned': chat.pinned }">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M16 12V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v8l-2 2v2h5.2v6h1.6v-6H17v-2l-1-1z"/>
                  </svg>
                  {{ chat.pinned ? '取消置顶' : '置顶' }}
                </button>
                <button @click="renameChat(getChatIndex(chat))">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                  重命名
                </button>
                <button @click="deleteChat(getChatIndex(chat))" class="delete-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <ChatWindow 
        :key="currentChatIndex"
        :chat-index="currentChatIndex"
        :chat-history="chatHistory"
        :avatars="avatarConfig"
        :config="chatConfig"
        @update:chat-history="chatHistory = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ChatWindow from './components/ChatWindow.vue';

// 从本地存储加载对话历史
const loadChatHistory = () => {
  const savedHistory = localStorage.getItem('chatHistory');
  if (savedHistory) {
    try {
      const parsed = JSON.parse(savedHistory);
      // 确保每个对话对象都有必要的属性
      const chats = parsed.map(chat => ({
        ...chat,
        messages: chat.messages || [],
        conversationId: chat.conversationId || null,
        pinned: chat.pinned || false,
        showOptions: false
      }));
      // 如果没有对话，返回默认对话
      return chats.length > 0 ? chats : getDefaultChats();
    } catch (e) {
      console.error('解析保存的对话历史失败:', e);
      return getDefaultChats();
    }
  }
  return getDefaultChats();
};

// 获取默认对话列表
const getDefaultChats = () => {
  return [
    { 
      title: '新对话', 
      pinned: false, 
      showOptions: false,
      messages: [],
      conversationId: null
    }
  ];
};

const chatHistory = ref(loadChatHistory());
const currentChatIndex = ref(parseInt(localStorage.getItem('currentChatIndex') || '0'));

// 确保当前索引有效
if (currentChatIndex.value >= chatHistory.value.length) {
  currentChatIndex.value = 0;
  localStorage.setItem('currentChatIndex', '0');
}

// 监听对话历史变化，保存到本地存储
watch(chatHistory, (newHistory) => {
  localStorage.setItem('chatHistory', JSON.stringify(newHistory));
}, { deep: true });

// 监听当前对话索引变化，保存到本地存储
watch(currentChatIndex, (newIndex) => {
  localStorage.setItem('currentChatIndex', newIndex.toString());
});

// 计算属性：置顶对话
const pinnedChats = computed(() => {
  return chatHistory.value.filter(chat => chat.pinned);
});

// 计算属性：非置顶对话
const unpinnedChats = computed(() => {
  return chatHistory.value.filter(chat => !chat.pinned);
});

// 获取对话在原始数组中的索引
const getChatIndex = (chat) => {
  return chatHistory.value.findIndex(c => c === chat);
};

const startNewChat = () => {
  // 查找是否存在未发送消息的新对话
  const emptyChatIndex = chatHistory.value.findIndex(chat => 
    chat.title === '新对话' && (!chat.messages || chat.messages.length === 0)
  );

  if (emptyChatIndex !== -1) {
    // 如果找到未发送消息的新对话，直接切换到该对话
    currentChatIndex.value = emptyChatIndex;
  } else {
    // 如果没有找到未发送消息的新对话，创建新的对话
    chatHistory.value.push({ 
      title: '新对话',
      pinned: false,
      showOptions: false,
      messages: [],
      conversationId: null
    });
    currentChatIndex.value = chatHistory.value.length - 1;
  }
};

const switchChat = (index) => {
  currentChatIndex.value = index;
  // 关闭所有选项菜单
  chatHistory.value.forEach(chat => chat.showOptions = false);
};

const showOptions = (index) => {
  // 关闭其他对话的选项菜单
  chatHistory.value.forEach((chat, i) => {
    chat.showOptions = i === index;
  });
};

const pinChat = (index) => {
  const chat = chatHistory.value[index];
  chat.pinned = !chat.pinned;
  // 更新当前选中的索引
  currentChatIndex.value = getChatIndex(chat);
};

const renameChat = (index) => {
  const newTitle = prompt('请输入新的对话名称：', chatHistory.value[index].title);
  if (newTitle && newTitle.trim()) {
    chatHistory.value[index].title = newTitle.trim();
  }
};

const deleteChat = (index) => {
  if (confirm('确定要删除这个对话吗？')) {
    // 如果只剩最后一个对话，不删除
    if (chatHistory.value.length <= 1) {
      alert('至少需要保留一个对话');
      return;
    }
    
    chatHistory.value.splice(index, 1);
    // 如果删除的是当前对话，切换到第一个对话
    if (currentChatIndex.value >= chatHistory.value.length) {
      currentChatIndex.value = 0;
    }
  }
};

// 点击其他地方关闭选项菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.chat-item-actions')) {
    chatHistory.value.forEach(chat => chat.showOptions = false);
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// 自定义头像配置
const avatarConfig = {
  user: {
    type: 'svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
    </svg>`
  },
  bot: {
    type: 'image',
    content: '/avatar/bot.png'
  },
  system: {
    type: 'image',
    content: '/avatar/bot.png'
  }
};

// 聊天配置
const chatConfig = {
  welcomeMessage: '您好！我是研考问答智能助手研小芽，专为报考武汉理工大学研究生（硕士与博士）的考生提供咨询服务。您可以向我提问武汉理工大学研究生招生相关问题，包括报考资格、招生简章、学费标准、奖助政策等内容等。\n特别说明：若遇个性化问题或政策更新，欢迎您直接致电研招办官方热线027-87651413。\n期待金秋时节与您在理工大校园相逢！',
  placeholder: '在此输入您的问题...',
  loadingText: '正在思考...'
};
</script>

<style>
/* 全局样式 (可选) */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f4f5f7; /* 淡雅的背景色 */
}

#app {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.sidebar {
  width: 260px;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-header h2 {
  margin: 0 0 15px 0;
  color: #1f2d3d;
  font-size: 1.2em;
}

.new-chat-btn {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background-color: #0056b3;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: background-color 0.2s;
  position: relative;
}

.chat-item:hover {
  background-color: #f0f2f5;
}

.chat-item.active {
  background-color: #e7f3ff;
  color: #007bff;
}

.chat-title {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.chat-item-actions {
  position: relative;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-item:hover .chat-item-actions {
  opacity: 1;
}

.more-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.more-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.options-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  margin-top: 4px;
}

.options-menu button {
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
  font-size: 14px;
  text-align: left;
}

.options-menu button:hover {
  background-color: #f5f5f5;
}

.options-menu button.pinned {
  color: #007bff;
}

.options-menu .delete-btn {
  color: #dc3545;
}

.options-menu .delete-btn:hover {
  background-color: #fff5f5;
}

/* 确保选项菜单在滚动时不会被截断 */
.chat-history {
  position: relative;
}

.main-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f4f5f7;
}

.chat-group {
  margin-bottom: 20px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-header svg {
  color: #999;
}

/* 确保选项菜单在滚动时不会被截断 */
.chat-history {
  position: relative;
  padding-bottom: 20px;
}

/* 调整对话项样式以适应分组 */
.chat-item {
  margin: 2px 0;
}

/* 当没有置顶对话时隐藏置顶分组 */
.chat-group:empty {
  display: none;
}
</style> 