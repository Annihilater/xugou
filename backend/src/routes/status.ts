import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { cors } from 'hono/cors';
import { Bindings } from '../models/db';

import {
  Monitor,
  Agent,
  getConfigMonitors,
  getConfigAgents,
  getStatusPageConfigById,
  updateStatusPageConfig,
  createStatusPageConfig,
  clearConfigMonitorLinks,
  clearConfigAgentLinks,
  addMonitorToConfig,
  addAgentToConfig,
  getAllStatusPageConfigs,
  getSelectedMonitors,
  getSelectedAgents,
  getMonitorsByIds,
  getMonitorHistory,
  getAgentsByIds,
  getAdminUserId,
  createDefaultConfig
} from '../db/status';
import { getJwtSecret } from '../utils/jwt';
// 状态页配置接口
interface StatusPageConfig {
  title: string;
  description: string;
  logoUrl: string;
  customCss: string;
  monitors: number[]; // 已选择的监控项ID
  agents: number[]; // 已选择的客户端ID
}

// 创建API路由
const app = new Hono<{ Bindings: Bindings }>();

// 启用CORS
app.use('/*', cors());

// 创建管理员路由组
const adminRoutes = new Hono<{ Bindings: Bindings }>();

// 使用中间件验证JWT（仅对管理员路由）
adminRoutes.use('/*', async (c, next) => {
  const jwtMiddleware = jwt({
    secret: getJwtSecret(c)
  });
  return jwtMiddleware(c, next);
});

// 获取状态页配置(管理员)
adminRoutes.get('/config', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  
  try {
    // 检查是否已存在配置
    const existingConfig = await getStatusPageConfigById(c.env.DB, userId);
    
    console.log('状态页配置查询结果:', existingConfig);
    
    let configId: number;
    
    if (existingConfig && existingConfig.id) {
      configId = existingConfig.id;
    } else {
      // 创建默认配置
      const insertResult = await createStatusPageConfig(
        c.env.DB,
        userId,
        '系统状态',
        '实时监控系统状态',
        '',
        ''
      );
      
      if (!insertResult || typeof insertResult.id !== 'number') {
        throw new Error('创建状态页配置失败');
      }
      
      configId = insertResult.id;
    }
    
    // 获取该用户的所有监控项
    const monitorsResult = await getConfigMonitors(c.env.DB, configId, userId);
    
    // 获取该用户的所有客户端
    const agentsResult = await getConfigAgents(c.env.DB, configId, userId);
    
    // 构建配置对象返回
    const config = await c.env.DB.prepare(
      'SELECT * FROM status_page_config WHERE id = ?'
    ).bind(configId).first<{
      title?: string; 
      description?: string; 
      logo_url?: string; 
      custom_css?: string;
    }>();
    
    return c.json({
      title: config?.title || '',
      description: config?.description || '',
      logoUrl: config?.logo_url || '',
      customCss: config?.custom_css || '',
      monitors: monitorsResult.results?.map(m => ({
        id: m.id,
        name: m.name,
        selected: m.selected === 1
      })) || [],
      agents: agentsResult.results?.map(a => ({
        id: a.id,
        name: a.name,
        selected: a.selected === 1
      })) || []
    });
  } catch (error) {
    console.error('获取状态页配置失败:', error);
    return c.json({ error: '获取状态页配置失败' }, 500);
  }
});

// 保存状态页配置
adminRoutes.post('/config', async (c) => {
  const payload = c.get('jwtPayload');
  const userId = payload.id;
  const data = await c.req.json() as StatusPageConfig;
  
  console.log('接收到的配置数据:', JSON.stringify(data));
  
  if (!data) {
    console.log('无效的请求数据');
    return c.json({ error: '无效的请求数据' }, 400);
  }
  
  try {
    // 检查是否已存在配置
    const existingConfig = await getStatusPageConfigById(c.env.DB, userId);
    
    console.log('现有配置查询结果:', existingConfig);
    
    let configId: number;
    
    if (existingConfig && existingConfig.id) {
      // 更新现有配置
      console.log('更新现有配置ID:', existingConfig.id);
      await updateStatusPageConfig(
        c.env.DB,
        existingConfig.id,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );
      
      configId = existingConfig.id;
    } else {
      // 创建新配置
      console.log('创建新配置');
      const insertResult = await createStatusPageConfig(
        c.env.DB,
        userId,
        data.title,
        data.description,
        data.logoUrl,
        data.customCss
      );
      
      console.log('插入配置结果:', insertResult);
      
      if (!insertResult || typeof insertResult.id !== 'number') {
        throw new Error('创建状态页配置失败');
      }
      
      configId = insertResult.id;
    }
    
    // 清除现有的监控项关联
    console.log('清除配置ID的现有监控关联:', configId);
    const deleteMonitorsResult = await clearConfigMonitorLinks(c.env.DB, configId);
    console.log('删除现有监控关联结果:', deleteMonitorsResult);
    
    // 清除现有的客户端关联
    console.log('清除配置ID的现有客户端关联:', configId);
    const deleteAgentsResult = await clearConfigAgentLinks(c.env.DB, configId);
    console.log('删除现有客户端关联结果:', deleteAgentsResult);
    
    // 添加选定的监控项
    console.log('接收到的监控项IDs:', data.monitors);
    if (data.monitors && data.monitors.length > 0) {
      console.log(`添加 ${data.monitors.length} 个监控项`);
      for (const monitorId of data.monitors) {
        const insertResult = await addMonitorToConfig(c.env.DB, configId, monitorId);
        console.log(`添加监控项 ${monitorId} 结果:`, insertResult);
      }
    } else {
      console.log('没有选中的监控项需要添加');
    }
    
    // 添加选定的客户端
    console.log('接收到的客户端IDs:', data.agents);
    if (data.agents && data.agents.length > 0) {
      console.log(`添加 ${data.agents.length} 个客户端`);
      for (const agentId of data.agents) {
        const insertResult = await addAgentToConfig(c.env.DB, configId, agentId);
        console.log(`添加客户端 ${agentId} 结果:`, insertResult);
      }
    } else {
      console.log('没有选中的客户端需要添加');
    }
    
    return c.json({ success: true, configId });
  } catch (error) {
    console.error('保存状态页配置失败:', error);
    return c.json({ error: '保存状态页配置失败' }, 500);
  }
});

// 公共路由
// 获取状态页数据（公开访问）
app.get('/data', async (c) => {
  try {
    // 获取所有配置
    console.log('获取状态页配置...');
    const configsResult = await getAllStatusPageConfigs(c.env.DB);
    
    console.log('状态页配置查询结果:', JSON.stringify(configsResult));
    
    if (!configsResult.results || configsResult.results.length === 0) {
      console.log('未找到状态页配置，返回默认配置');
      
      // 尝试创建一个默认配置
      try {
        const adminUser = await getAdminUserId(c.env.DB);
        if (adminUser && adminUser.id) {
          const configId = await createDefaultConfig(c.env.DB, adminUser.id);
          if (configId) {
            // 重新获取新创建的配置
            const defaultConfig = await createDefaultStatusPageData(c);
            if (defaultConfig) {
              return c.json({ 
                success: true,
                data: defaultConfig
              });
            }
          }
        }
      } catch (error) {
        console.error('创建默认配置失败:', error);
      }
      
      return c.json({ 
        success: true,
        data: {
          title: '系统状态',
          description: '实时监控系统状态',
          logoUrl: '',
          customCss: '',
          monitors: [],
          agents: []
        }
      });
    }
    
    // 简单处理：获取第一个配置
    const config = configsResult.results[0];
    console.log('找到状态页配置:', config);
    
    // 获取选中的监控项
    const selectedMonitors = await getSelectedMonitors(c.env.DB, config.id as number);
    
    console.log('选中的监控项:', JSON.stringify(selectedMonitors));
    
    // 获取选中的客户端
    const selectedAgents = await getSelectedAgents(c.env.DB, config.id as number);
    
    console.log('选中的客户端:', JSON.stringify(selectedAgents));
    
    // 获取监控项详细信息
    let monitors: Monitor[] = [];
    if (selectedMonitors.results && selectedMonitors.results.length > 0) {
      const monitorIds = selectedMonitors.results.map(m => m.monitor_id);
      
      console.log(`查询监控项详情, IDs: ${monitorIds}`);
      
      if (monitorIds.length > 0) {
        const monitorsResult = await getMonitorsByIds(c.env.DB, monitorIds);
        
        console.log('监控项查询结果:', JSON.stringify(monitorsResult));
        
        if (monitorsResult.results) {
          // 获取每个监控的历史记录
          monitors = await Promise.all(monitorsResult.results.map(async (monitor) => {
            const historyResult = await getMonitorHistory(c.env.DB, monitor.id);
            
            // 将历史记录转换为状态数组
            const history = historyResult.results 
              ? historyResult.results.map(h => h.status)
              : Array(24).fill('unknown');
              
            return {
              ...monitor,
              history
            };
          }));
        }
      }
    } else {
      console.log('没有配置的监控项，返回空列表');
    }
    
    // 获取客户端详细信息
    let agents: Agent[] = [];
    if (selectedAgents.results && selectedAgents.results.length > 0) {
      const agentIds = selectedAgents.results.map(a => a.agent_id);
      
      console.log(`查询客户端详情, IDs: ${agentIds}`);
      
      if (agentIds.length > 0) {
        const agentsResult = await getAgentsByIds(c.env.DB, agentIds);
        
        console.log('客户端查询结果:', JSON.stringify(agentsResult));
        
        if (agentsResult.results) {
          agents = agentsResult.results;
        }
      }
    } else {
      // 修改: 不再自动获取所有客户端并关联
      console.log('没有配置的客户端，返回空列表');
      // 这里不再获取所有活跃客户端和自动关联
    }
    
    // 构建并返回响应
    console.log('返回状态页数据:', {
      monitors: monitors.length,
      agents: agents.length
    });
    
    // 为监控项添加必要的字段
    const enrichedMonitors = monitors.map((monitor: any) => ({
      ...monitor,
      status: monitor.status || 'unknown',
      uptime: monitor.uptime || 0,
      response_time: monitor.response_time || 0,
      history: monitor.history || Array(24).fill('unknown')
    }));
    
    // 为客户端添加资源使用情况字段
    const enrichedAgents = agents.map((agent: any) => {
      // 计算内存使用百分比 (如果有总量和使用量)
      const memoryPercent = agent.memory_total && agent.memory_used
        ? (agent.memory_used / agent.memory_total) * 100
        : null;
        
      // 计算磁盘使用百分比 (如果有总量和使用量)
      const diskPercent = agent.disk_total && agent.disk_used
        ? (agent.disk_used / agent.disk_total) * 100
        : null;
        
      return {
        ...agent,
        // 使用数据库中的 status 字段，不重新计算
        cpu: agent.cpu_usage || 0,               // 使用数据库中的CPU使用率
        memory: memoryPercent || 0,              // 使用数据库中的内存使用百分比
        disk: diskPercent || 0,                  // 使用数据库中的磁盘使用百分比
        network_rx: agent.network_rx || 0,       // 使用数据库中的网络下载速率
        network_tx: agent.network_tx || 0,       // 使用数据库中的网络上传速率
        hostname: agent.hostname || "未知主机",
        ip_address: agent.ip_address || "0.0.0.0",
        os: agent.os || "未知系统",
        version: agent.version || "未知版本"
      };
    });
    
    return c.json({
      success: true,
      data: {
        title: config.title,
        description: config.description,
        logoUrl: config.logo_url,
        customCss: config.custom_css,
        monitors: enrichedMonitors,
        agents: enrichedAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          cpu: agent.cpu,
          memory: agent.memory,
          disk: agent.disk,
          network_rx: agent.network_rx,
          network_tx: agent.network_tx,
          hostname: agent.hostname,
          ip_address: agent.ip_address,
          os: agent.os,
          version: agent.version
        }))
      }
    });
  } catch (error) {
    console.error('获取状态页数据失败:', error);
    return c.json({ success: false, message: '获取状态页数据失败', error: String(error) }, 500);
  }
});

// 创建默认状态页数据
async function createDefaultStatusPageData(c: any) {
  try {
    // 获取所有配置
    const configsResult = await getAllStatusPageConfigs(c.env.DB);
    if (!configsResult.results || configsResult.results.length === 0) {
      return null;
    }
    
    const config = configsResult.results[0];
    
    // 获取选中的监控项
    const selectedMonitors = await getSelectedMonitors(c.env.DB, config.id as number);
    
    // 获取选中的客户端
    const selectedAgents = await getSelectedAgents(c.env.DB, config.id as number);
    
    // 获取监控项详细信息
    let monitors: any[] = [];
    if (selectedMonitors.results && selectedMonitors.results.length > 0) {
      const monitorIds = selectedMonitors.results.map(m => m.monitor_id);
      
      if (monitorIds.length > 0) {
        const monitorsResult = await getMonitorsByIds(c.env.DB, monitorIds);
        
        if (monitorsResult.results) {
          monitors = monitorsResult.results;
        }
      }
    }
    
    // 获取客户端详细信息
    let agents: any[] = [];
    if (selectedAgents.results && selectedAgents.results.length > 0) {
      const agentIds = selectedAgents.results.map(a => a.agent_id);
      
      if (agentIds.length > 0) {
        const agentsResult = await getAgentsByIds(c.env.DB, agentIds);
        
        if (agentsResult.results) {
          agents = agentsResult.results;
        }
      }
    }
    
    // 为监控项添加必要的字段
    const enrichedMonitors = monitors.map(monitor => ({
      ...monitor,
      status: monitor.status || 'unknown',
      uptime: monitor.uptime || 0,
      response_time: monitor.response_time || 0,
      history: Array(24).fill('unknown')
    }));
    
    // 为客户端添加资源使用情况字段
    const enrichedAgents = agents.map(agent => {
      // 计算内存使用百分比 (如果有总量和使用量)
      const memoryPercent = agent.memory_total && agent.memory_used
        ? (agent.memory_used / agent.memory_total) * 100
        : null;
        
      // 计算磁盘使用百分比 (如果有总量和使用量)
      const diskPercent = agent.disk_total && agent.disk_used
        ? (agent.disk_used / agent.disk_total) * 100
        : null;
        
      return {
        ...agent,
        cpu: agent.cpu_usage || 0,
        memory: memoryPercent || 0,
        disk: diskPercent || 0,
        network_rx: agent.network_rx || 0,
        network_tx: agent.network_tx || 0,
        hostname: agent.hostname || "未知主机",
        ip_address: agent.ip_address || "0.0.0.0",
        os: agent.os || "未知系统",
        version: agent.version || "未知版本"
      };
    });
    
    return {
      title: config.title,
      description: config.description,
      logoUrl: config.logo_url,
      customCss: config.custom_css,
      monitors: enrichedMonitors,
      agents: enrichedAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        cpu: agent.cpu,
        memory: agent.memory,
        disk: agent.disk,
        network_rx: agent.network_rx,
        network_tx: agent.network_tx,
        hostname: agent.hostname,
        ip_address: agent.ip_address,
        os: agent.os,
        version: agent.version
      }))
    };
  } catch (error) {
    console.error('创建默认配置失败:', error);
    return null;
  }
}

// 注册管理员路由
app.route('/', adminRoutes);

export default app; 