// 生成设备唯一标识
export const generateDeviceId = () => {
  const userAgent = navigator.userAgent;
  const screenInfo = `${screen.width}x${screen.height}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // 组合设备信息
  const deviceInfo = `${userAgent}|${screenInfo}|${timeZone}|${language}`;
  
  // 使用简单的哈希函数生成ID
  let hash = 0;
  for (let i = 0; i < deviceInfo.length; i++) {
    const char = deviceInfo.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `web-user-${Math.abs(hash).toString(36)}`;
};

// 获取设备ID
export const deviceId = generateDeviceId(); 