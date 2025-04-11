import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { Context, Next } from 'hono';
import { Bindings } from '../models/db';
import { Agent } from '../models/agent';
import { getJwtSecret, generateToken, verifyToken } from '../utils/jwt';
import { 
  getAllAgents, 
  getAgentsByUser,
  getAgentById, 
  createAgent, 
  updateAgent, 
  updateAgentStatus, 
  deleteAgent, 
  updateAgentToken, 
  getAgentByToken,
  getAdminUserId
} from '../db/agent';

const agents = new Hono<{ Bindings: Bindings; Variables: { agent: Agent; jwtPayload: any } }>();

// 中间件：JWT 认证
agents.use('*', async (c, next) => {
  // 跳过特定路由的认证 (客户端上报指标接口和注册接口)
  if ((c.req.path.endsWith('/status') || c.req.path.endsWith('/register')) && c.req.method === 'POST') {
    return next();
  }
  
  const jwtMiddleware = jwt({
    secret: getJwtSecret(c)
  });
  return jwtMiddleware(c, next);
});

// 获取所有客户端
agents.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    
    // 根据用户角色过滤客户端
    let result;
    if (payload.role === 'admin') {
      result = await getAllAgents(c.env.DB);
    } else {
      result = await getAgentsByUser(c.env.DB, payload.id);
    }
    
    return c.json({ success: true, agents: result.results || [] });
  } catch (error) {
    console.error('获取客户端列表错误:', error);
    return c.json({ 
      success: false, 
      message: '获取客户端列表失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 创建新客户端
agents.post('/', async (c) => {
  try {
    const { name } = await c.req.json();
    const payload = c.get('jwtPayload');
    
    const token = await generateToken(c.env);
    
    // 创建新客户端
    const newAgent = await createAgent(c.env.DB, name, token, payload.id);
    
    return c.json({ 
      success: true, 
      message: '客户端创建成功',
      agent: newAgent // 创建时返回完整信息，包括令牌
    }, 201);
  } catch (error) {
    console.error('创建客户端错误:', error);
    return c.json({ success: false, message: '创建客户端失败' }, 500);
  }
});

// 获取单个客户端
agents.get('/:id', async (c) => {
  try {
    const agentId = Number(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 获取客户端信息
    const agent = await getAgentById(c.env.DB, agentId);
    
    if (!agent) {
      return c.json({ success: false, message: '客户端不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && agent.created_by !== payload.id) {
      return c.json({ success: false, message: '无权访问此客户端' }, 403);
    }
    
    // 不返回令牌，但保留其他所有字段
    const { token, ...rest } = agent;
    
    return c.json({ 
      success: true, 
      agent: {
        ...rest,
        cpu_usage: rest.cpu_usage || 0,
        memory_total: rest.memory_total || 0,
        memory_used: rest.memory_used || 0,
        disk_total: rest.disk_total || 0,
        disk_used: rest.disk_used || 0,
        network_rx: rest.network_rx || 0,
        network_tx: rest.network_tx || 0
      }
    });
  } catch (error) {
    console.error('获取客户端详情错误:', error);
    return c.json({ success: false, message: '获取客户端详情失败' }, 500);
  }
});

// 更新客户端信息
agents.put('/:id', async (c) => {
  try {
    const agentId = Number(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 获取当前客户端数据
    const agent = await getAgentById(c.env.DB, agentId);
    
    if (!agent) {
      return c.json({ success: false, message: '客户端不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && agent.created_by !== payload.id) {
      return c.json({ success: false, message: '无权修改此客户端' }, 403);
    }
    
    // 获取更新数据
    const updateData = await c.req.json();
    
    // 执行更新
    const result = await updateAgent(c.env.DB, agentId, updateData);
    
    if (typeof result === 'object' && 'message' in result && result.message === '没有更新任何字段') {
      return c.json({ 
        success: true, 
        message: '没有更新任何字段', 
        agent
      });
    }
    
    return c.json({ 
      success: true, 
      message: '客户端信息已更新',
      agent: result
    });
  } catch (error) {
    console.error('更新客户端错误:', error);
    return c.json({ success: false, message: '更新客户端失败' }, 500);
  }
});

// 删除客户端
agents.delete('/:id', async (c) => {
  try {
    const agentId = Number(c.req.param('id'));
    const payload = c.get('jwtPayload');
    
    // 获取客户端信息
    const agent = await getAgentById(c.env.DB, agentId);
    
    if (!agent) {
      return c.json({ success: false, message: '客户端不存在' }, 404);
    }
    
    // 检查权限
    if (payload.role !== 'admin' && agent.created_by !== payload.id) {
      return c.json({ success: false, message: '无权删除此客户端' }, 403);
    }
    
    // 执行删除客户端
    const result = await deleteAgent(c.env.DB, agent.id);
    
    return c.json({ 
      success: true, 
      message: '客户端已删除'
    });
  } catch (error) {
    console.error('删除客户端错误:', error);
    return c.json({ success: false, message: '删除客户端失败' }, 500);
  }
});

// 生成客户端Token
agents.post('/token/generate', async (c) => {
  try {
    // 生成新令牌
    const newToken = await generateToken(c.env);
    
    // 可以选择将此token存储在临时表中，或者使用其他方式验证(例如，设置过期时间)
    // 这里为简化操作，只返回令牌

    return c.json({ 
      success: true, 
      message: '已生成客户端注册令牌',
      token: newToken
    });
  } catch (error) {
    console.error('生成注册令牌错误:', error);
    return c.json({ success: false, message: '生成注册令牌失败' }, 500);
  }
});

// 客户端自注册接口
agents.post('/register', async (c) => {
  try {
    const { token, name, hostname, ip_address, os, version } = await c.req.json();
    
    if (!token) {
      return c.json({ success: false, message: '缺少注册令牌' }, 400);
    }
    

    // 通过token查找客户端
    const existingAgent = await getAgentByToken(c.env.DB, token);

    if (existingAgent) {
      return c.json({ success: false, message: '客户端已存在' }, 400);
    }


    // 验证令牌
    const tokenVerification = await verifyToken(token, c.env);
    
    // 如果令牌无效，返回错误
    if (!tokenVerification.valid) {
      return c.json({ 
        success: false, 
        message: `注册令牌无效: ${tokenVerification.message}` 
      }, 401);
    }
    
    // 查找管理员用户作为客户端创建者
    const adminId = await getAdminUserId(c.env.DB);
    
    // 如果客户端不存在，则创建新客户端
    const newAgent = await createAgent(
      c.env.DB,
      name || 'New Agent',
      token,
      adminId,
      'active',
      hostname || null,
      ip_address || null,
      os || null,
      version || null
    );
    
    return c.json({ 
      success: true, 
      message: '客户端注册成功',
      agent: { id: newAgent.id }
    }, 201);
  } catch (error) {
    console.error('客户端注册错误:', error);
    return c.json({ 
      success: false, 
      message: '客户端注册失败',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// 通过令牌更新客户端状态
agents.post('/status', async (c) => {
  try {
    const { 
      token,
      cpu_usage, 
      memory_total, 
      memory_used, 
      disk_total, 
      disk_used, 
      network_rx, 
      network_tx,
      hostname,
      ip_address,
      os,
      version
    } = await c.req.json();
    
    if (!token) {
      return c.json({ success: false, message: '缺少API令牌' }, 400);
    }
    
    // 通过token查找客户端
    const agent = await getAgentByToken(c.env.DB, token);
    
    if (!agent) {
      return c.json({ success: false, message: '客户端不存在或令牌无效' }, 404);
    }
    
    // 更新客户端状态和资源指标
    await updateAgentStatus(c.env.DB, agent.id, 'active', {
      cpu_usage,
      memory_total,
      memory_used,
      disk_total,
      disk_used,
      network_rx,
      network_tx,
      hostname,
      ip_address,
      os,
      version
    });
    
    // 动态导入阈值通知函数以避免循环依赖
    const { handleAgentThresholdNotification } = await import('../tasks/agent-task');
    
    // 检查CPU使用率是否需要通知
    if (typeof cpu_usage === 'number') {
      await handleAgentThresholdNotification(c.env, agent.id, 'cpu', cpu_usage);
    }
    
    // 检查内存使用率是否需要通知
    if (typeof memory_total === 'number' && typeof memory_used === 'number' && memory_total > 0) {
      const memoryUsagePercent = (memory_used / memory_total) * 100;
      await handleAgentThresholdNotification(c.env, agent.id, 'memory', memoryUsagePercent);
    }
    
    // 检查磁盘使用率是否需要通知
    if (typeof disk_total === 'number' && typeof disk_used === 'number' && disk_total > 0) {
      const diskUsagePercent = (disk_used / disk_total) * 100;
      await handleAgentThresholdNotification(c.env, agent.id, 'disk', diskUsagePercent);
    }
    
    return c.json({ 
      success: true, 
      message: '客户端状态已更新'
    });
  } catch (error) {
    console.error('更新客户端状态错误:', error);
    return c.json({ success: false, message: '更新客户端状态失败' }, 500);
  }
});

export default agents; 