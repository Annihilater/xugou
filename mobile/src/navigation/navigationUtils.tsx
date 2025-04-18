import { createNavigationContainerRef } from '@react-navigation/native';

// 创建导航引用，以便在组件外部进行导航（如登出时）
export const navigationRef = createNavigationContainerRef();

export function navigateAndReset(name: string) {
  console.log(`尝试重置导航到: ${name}，navigationRef就绪状态: ${navigationRef.isReady()}`);
  
  if (navigationRef.isReady()) {
    try {
      navigationRef.reset({
        index: 0,
        routes: [{ name }],
      });
      console.log(`成功重置导航到: ${name}`);
    } catch (e) {
      console.error(`重置导航失败: ${e}`);
      
      // 尝试备用方案: 直接调用navigate
      try {
        navigationRef.navigate(name as never);
        console.log(`备用方案: 使用navigate导航到: ${name}`);
      } catch (navError) {
        console.error(`备用导航也失败: ${navError}`);
      }
    }
  } else {
    console.warn(`导航容器未准备好，无法重置到: ${name}`);
    
    // 记录当前状态，稍后可能会需要
    setTimeout(() => {
      if (navigationRef.isReady()) {
        console.log('导航容器已就绪，重试导航');
        try {
          navigationRef.reset({
            index: 0,
            routes: [{ name }],
          });
          console.log(`延迟重置导航成功: ${name}`);
        } catch (e) {
          console.error(`延迟重置导航失败: ${e}`);
        }
      } else {
        console.error('导航容器仍未就绪，放弃导航尝试');
      }
    }, 500); // 延迟500ms再检查
  }
} 