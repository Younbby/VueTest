<template>
  <div class="chat-window">
    <div class="messages-container" ref="messagesContainer">
      <!-- 欢迎消息 -->
      <div v-if="!currentChat.messages?.length" class="message bot system-message">
        <div class="avatar">
          <img v-if="avatars.system.type === 'image'" :src="avatars.system.content" alt="system avatar" />
          <div v-else v-html="avatars.system.content"></div>
        </div>
        <div class="content">
          <div v-html="renderMarkdown(config.welcomeMessage)"></div>
        </div>
      </div>
      <!-- 聊天消息 -->
      <div v-for="(msg, index) in currentChat.messages" :key="index" :class="['message', msg.sender]">
        <div class="avatar">
          <img v-if="avatars[msg.sender].type === 'image'" :src="avatars[msg.sender].content" :alt="msg.sender + ' avatar'" />
          <div v-else v-html="avatars[msg.sender].content"></div>
        </div>
        <div class="content" v-html="msg.sender === 'bot' ? renderMarkdown(msg.text.replace(/\n{2,}/g, '\n')) : msg.text.replace(/\n{2,}/g, '\n')" @vue:mounted="console.log('消息内容:', msg.text.replace(/\n{2,}/g, '\n'))"></div>
      </div>
      <!-- 加载提示 -->
      <div v-if="isLoading" class="message bot loading-indicator">
        <div class="avatar">
          <img v-if="avatars.bot.type === 'image'" :src="avatars.bot.content" alt="bot avatar" />
          <div v-else v-html="avatars.bot.content"></div>
        </div>
        <div class="content">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
      </div>
    </div>
    <!-- 将建议问题列表移至对话框下方 -->
    <div v-if="showSuggestedQuestions && currentSuggestedQuestions?.length" class="suggested-questions-container">
      <div class="suggested-questions">
        <div class="suggested-question" 
             v-for="(question, qIndex) in currentSuggestedQuestions" 
             :key="qIndex"
             @click="sendSuggestedQuestion(question)">
          {{ question }}
        </div>
      </div>
    </div>
    <div class="input-area">
      <input
        type="text"
        v-model="newMessage"
        @keyup.enter="sendMessage"
        :placeholder="config.placeholder"
        :disabled="isLoading"
        ref="inputField"
      />
      <button @click="sendMessage" :disabled="isLoading || !newMessage.trim()" title="发送">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import { deviceId } from '../utils/deviceId';
import { marked } from 'marked';

// 创建自定义渲染器
const renderer = new marked.Renderer();

// 自定义段落渲染，减少空行
renderer.paragraph = (text) => {
  return `<p>${text}</p>`;
};

// 自定义列表项渲染，减少间距
renderer.listitem = (text) => {
  return `<li>${text}</li>`;
};

// 配置marked选项
marked.setOptions({
  breaks: true, // 支持GitHub风格的换行
  gfm: true,    // 启用GitHub风格的Markdown
  headerIds: false, // 禁用标题ID生成
  mangle: false,    // 禁用标题ID转义
  sanitize: false,  // 允许HTML标签
  smartLists: true, // 使用更智能的列表行为
  smartypants: true, // 使用更智能的标点符号
  pedantic: false,  // 不那么严格的解析
  compact: true,    // 减少不必要的空行
  // renderer: renderer // 使用自定义渲染器
});

// 渲染Markdown文本
const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    // 如果text是对象，尝试提取其文本内容
    let textContent = text;
    if (typeof text === 'object') {
      // 如果对象有text属性，使用text属性
      if (text.text) {
        textContent = text.text;
      } else if (text.content) {
        textContent = text.content;
      } else if (text.message) {
        textContent = text.message;
      } else {
        // 如果没有找到合适的属性，将对象转换为格式化的JSON字符串
        textContent = JSON.stringify(text, null, 2);
      }
    }
    
    // 预处理文本，移除多余的空行
    const processedText = textContent.toString().replace(/\n{3,}/g, '\n\n');
    return marked(processedText);
  } catch (error) {
    console.error('Markdown渲染错误:', error);
    return typeof text === 'object' ? JSON.stringify(text, null, 2) : text.toString();
  }
};

const props = defineProps({
  chatIndex: {
    type: Number,
    required: true
  },
  chatHistory: {
    type: Array,
    required: true
  },
  // 添加头像配置
  avatars: {
    type: Object,
    default: () => ({
      user: {
        type: 'svg',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
        </svg>`
      },
      bot: {
        type: 'svg',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-4.83-4.17c-.33.67-.5 1.4-.5 2.17 0 .77.17 1.5.5 2.17.67-.33 1.4-.5 2.17-.5s1.5.17 2.17.5c.33-.67.5-1.4.5-2.17 0-.77-.17-1.5-.5-2.17-.67.33-1.4.5-2.17.5s-1.5-.17-2.17-.5z"></path>
        </svg>`
      },
      system: {
        type: 'svg',
        content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2v-2zm0 4h2v4h-2v-4z"></path>
        </svg>`
      }
    })
  },
  // 添加聊天配置
  config: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:chatHistory']);

// --- Dify API 配置 ---
// !! 警告: 请勿在前端硬编码 API Key。应通过后端代理或安全的环境变量配置。
const DIFY_CHAT_URL = 'https://api.dify.ai/v1/chat-messages'; // 替换为你的 Dify API 地址
const DIFY_API_KEY = 'app-nGcvdBUzl82wEzy3vvlMblfp';   // 替换为你的 Dify API Key

const newMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const inputField = ref(null);

// 获取当前对话
const currentChat = computed(() => props.chatHistory[props.chatIndex]);

// 添加建议问题相关的状态
const showSuggestedQuestions = ref(true);
const currentSuggestedQuestions = ref([]);

// 监听对话切换，重置输入框并滚动到底部
watch(() => props.chatIndex, () => {
  newMessage.value = '';
  // 确保在下一个渲染周期滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
});

// 监听消息变化，自动滚动到底部
watch(() => props.chatHistory[props.chatIndex]?.messages, () => {
  // 确保在下一个渲染周期滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
}, { deep: true });

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    const container = messagesContainer.value;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }
};

// 更新对话数据
const updateChat = (updates) => {
  const newHistory = [...props.chatHistory];
  newHistory[props.chatIndex] = {
    ...newHistory[props.chatIndex],
    ...updates
  };
  emit('update:chatHistory', newHistory);
};

// 获取建议问题
const fetchSuggestedQuestions = async (messageId) => {
  try {
    const response = await fetch(`https://api.dify.ai/v1/messages/${messageId}/suggested?user=${deviceId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`获取建议问题失败: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('获取建议问题失败:', error);
    return [];
  }
};

// 修改发送建议问题的函数
const sendSuggestedQuestion = (question) => {
  newMessage.value = question;
  showSuggestedQuestions.value = false; // 点击后隐藏建议问题列表
  sendMessage();
};

// 修改 sendMessage 函数中获取建议问题的部分
const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  const userMessage = { sender: 'user', text };
  const currentMessages = currentChat.value.messages || [];
  
  // 如果是第一次发送消息，更新对话标题
  if (currentMessages.length === 0 && currentChat.value.title === '新对话') {
    const newTitle = text.length > 10 ? text.slice(0, 10) + '...' : text;
    updateChat({
      title: newTitle,
      messages: [userMessage]
    });
  } else {
    updateChat({
      messages: [...currentMessages, userMessage]
    });
  }

  newMessage.value = '';
  scrollToBottom();
  isLoading.value = true;

  try {
    // --- 调用 Dify API ---
    const response = await fetch(DIFY_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DIFY_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: {},
        query: text,
        user: deviceId,
        conversation_id: currentChat.value.conversationId || undefined,
        response_mode: 'streaming'
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API 错误 ${response.status}: ${errorData || response.statusText}`);
    }

    // --- 处理 Dify 响应 ---
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botMessageText = '';
      let botMessageIndex = -1;
      let messageId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.substring(6));

              if (jsonData.event === 'agent_message' || jsonData.event === 'message') {
                botMessageText += jsonData.answer;
                if (botMessageIndex === -1) {
                  const currentMessages = currentChat.value.messages || [];
                  updateChat({
                    messages: [...currentMessages, { sender: 'bot', text: botMessageText }]
                  });
                  botMessageIndex = currentMessages.length;
                } else {
                  const currentMessages = [...currentChat.value.messages];
                  currentMessages[botMessageIndex].text = botMessageText;
                  updateChat({ messages: currentMessages });
                }
                scrollToBottom();
              } else if (jsonData.event === 'message_end') {
                if (jsonData.conversation_id) {
                  updateChat({ conversationId: jsonData.conversation_id });
                }
                messageId = jsonData.id;
              }
            } catch (e) {
              console.warn("解析 SSE 数据块失败:", e, "原始数据:", line);
            }
          }
        }
      }

      // 获取建议问题
      if (messageId) {
        const suggestedQuestions = await fetchSuggestedQuestions(messageId);
        if (suggestedQuestions.length > 0) {
          currentSuggestedQuestions.value = suggestedQuestions;
          showSuggestedQuestions.value = true;
        }
      }
    } else {
      const data = await response.json();
      if (data.answer) {
        const currentMessages = currentChat.value.messages || [];
        updateChat({
          messages: [...currentMessages, { sender: 'bot', text: data.answer }],
          conversationId: data.conversation_id
        });
        scrollToBottom();

        // 获取建议问题
        if (data.id) {
          const suggestedQuestions = await fetchSuggestedQuestions(data.id);
          if (suggestedQuestions.length > 0) {
            const currentMessages = [...currentChat.value.messages];
            currentMessages[currentMessages.length - 1].suggestedQuestions = suggestedQuestions;
            updateChat({ messages: currentMessages });
          }
        }
      } else {
        throw new Error('非流式响应格式不正确');
      }
    }
  } catch (error) {
    console.error('调用 Dify API 失败:', error);
    const currentMessages = currentChat.value.messages || [];
    updateChat({
      messages: [...currentMessages, { sender: 'bot', text: `抱歉，暂时无法连接服务 (${error.message})` }]
    });
    scrollToBottom();
  } finally {
    isLoading.value = false;
    nextTick(() => {
      inputField.value?.focus();
    });
  }
};

// 组件挂载后，输入框自动聚焦并滚动到底部
onMounted(() => {
  inputField.value?.focus();
  // 确保在下一个渲染周期滚动到底部
  nextTick(() => {
    scrollToBottom();
  });
});

</script>

<style scoped>
.chat-window {
  width: 100%;
  height: 100%;
  max-width: 1200px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.messages-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px;
  background-color: #f4f7f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: calc(100vh - 180px);
}

.message {
  display: flex;
  align-items: flex-start; /* 头像和顶部内容对齐 */
  max-width: 85%; /* 限制消息最大宽度 */
  animation: fadeIn 0.3s ease-out; /* 消息淡入效果 */
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message .avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
  background-color: #e0e0e0;
  color: #666;
  overflow: hidden;
}

.message .avatar :deep(svg) {
  width: 20px;
  height: 20px;
}

.message .avatar :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message .content {
  padding: 8px 12px;
  border-radius: 18px;
  background-color: #e9e9eb; /* 默认消息背景 */
  color: #333;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  position: relative;
  font-size: 14px;
  letter-spacing: 0.3px;
}

/* Markdown 内容样式 */
.message .content :deep(h1),
.message .content :deep(h2),
.message .content :deep(h3),
.message .content :deep(h4),
.message .content :deep(h5),
.message .content :deep(h6) {
  margin-top: 0.3em;
  margin-bottom: 0.3em;
  font-weight: 600;
  line-height: 1.25;
}

.message .content :deep(h1) { font-size: 1.5em; }
.message .content :deep(h2) { font-size: 1.3em; }
.message .content :deep(h3) { font-size: 1.2em; }
.message .content :deep(h4) { font-size: 1.1em; }
.message .content :deep(h5) { font-size: 1em; }
.message .content :deep(h6) { font-size: 0.9em; }

.message .content :deep(strong),
.message .content :deep(b) {
  color: #333;
  font-weight: 700;
}

.message .content :deep(em),
.message .content :deep(i) {
  font-style: italic;
}

.message .content :deep(p) {
  margin-top: 0.3em;
  margin-bottom: 0.3em;
  line-height: 1.4;
}

.message .content :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.message .content :deep(a:hover) {
  text-decoration: underline;
}

.message .content :deep(ul),
.message .content :deep(ol) {
  padding-left: 1.5em;
  margin-top: 0.3em;
  margin-bottom: 0.3em;
}

.message .content :deep(li) {
  margin-bottom: 0.15em;
}

.message .content :deep(blockquote) {
  margin: 0.3em 0;
  padding: 0.3em 1em;
  border-left: 4px solid #dfe2e5;
  background-color: rgba(0, 0, 0, 0.03);
  color: #6a737d;
}

.message .content :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}

.message .content :deep(pre) {
  margin: 0.3em 0;
  padding: 0.8em;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.message .content :deep(pre code) {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
}

.message .content :deep(table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin: 0.5em 0;
  width: 100%;
}

.message .content :deep(table th),
.message .content :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.message .content :deep(table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.message .content :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.message .content :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #fff;
}

.message .content :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 1em 0;
  background-color: #e1e4e8;
  border: 0;
}

/* 用户消息样式 */
.message.user {
  align-self: flex-end;
  flex-direction: row-reverse; /* 头像和内容反向 */
}

.message.user .avatar {
  margin-right: 0;
  margin-left: 12px;
  background-color: #007bff; /* 用户头像颜色 */
  color: white;
}

.message.user .content {
  background-color: #007bff; /* 用户消息气泡颜色 */
  color: white;
  border-bottom-right-radius: 5px; /* 调整气泡尖角 */
}

/* 机器人消息样式 */
.message.bot {
  align-self: flex-start;
}
.message.bot .avatar {
   background-color: #6c757d; /* 机器人头像颜色 */
   color: white;
}
.message.bot .content {
  background-color: #f0f2f5; /* 机器人消息气泡颜色 */
  color: #212529;
  border-bottom-left-radius: 5px; /* 调整气泡尖角 */
}

/* 系统提示消息 */
.message.system-message .content {
    background-color: #e7f3ff;
    color: #0056b3;
    font-size: 0.9em;
    text-align: center;
    border-radius: 8px;
    width: 100%; /* 让系统消息横跨 */
    max-width: 100%;
    box-shadow: none;
}
.message.system-message .avatar {
    background-color: #bcdffd;
    color: #0056b3;
}
.message.system-message {
    align-self: center; /* 居中显示 */
    width: auto; /* 内容自适应 */
    max-width: 90%; /* 限制最大宽度 */
}

/* 加载指示器样式 */
.loading-indicator .content {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    background-color: #f0f2f5;
    color: #6c757d;
}
.loading-indicator .dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #6c757d;
    margin: 0 2px;
    animation: typing-dots 1.2s infinite ease-in-out;
}
.loading-indicator .dot:nth-child(2) { animation-delay: 0.2s; }
.loading-indicator .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-dots {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
}


.input-area {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-top: none;
  background-color: #ffffff;
}

.input-area input {
  flex-grow: 1;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 20px; /* 圆角输入框 */
  margin-right: 10px;
  outline: none;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-area input:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.input-area input:disabled {
    background-color: #e9ecef;
}

.input-area button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  background-color: #007bff; /* 按钮颜色 */
  color: white;
  border-radius: 50%; /* 圆形按钮 */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease, transform 0.1s ease;
}

.input-area button:hover {
  background-color: #0056b3;
}
.input-area button:active {
    transform: scale(0.95); /* 轻微按下效果 */
}
.input-area button:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
  transform: none;
}

/* 滚动条美化 */
.messages-container::-webkit-scrollbar {
  width: 6px;
}
.messages-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}
.messages-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 用户消息中的Markdown样式调整 */
.message.user .content :deep(strong),
.message.user .content :deep(b) {
  color: #ffffff;
  font-weight: 700;
}

.message.user .content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* 机器人消息中的Markdown样式调整 */
.message.bot .content :deep(strong),
.message.bot .content :deep(b) {
  color: #1a1a1a;
  font-weight: 700;
}

/* 建议问题容器样式 */
.suggested-questions-container {
  padding: 12px 15px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
}

.suggested-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggested-question {
  padding: 6px 12px;
  background-color: #f0f2f5;
  border-radius: 16px;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0;
}

.suggested-question:hover {
  background-color: #e0e0e0;
  transform: translateY(-1px);
}
</style> 