import { useState, useEffect } from 'react';
import { Box, Flex, Heading, Text, Grid, Button, Container } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, ClockIcon, GlobeIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { getAllMonitors, Monitor } from '../api/monitors';
import { getAllAgents, Agent } from '../api/agents';
import StatusSummaryCard from '../components/StatusSummaryCard';
import MonitorCard from '../components/MonitorCard';
import AgentCard from '../components/AgentCard';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // 获取所有数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 同时获取监控和客户端数据
        const [monitorsResponse, agentsResponse] = await Promise.all([
          getAllMonitors(),
          getAllAgents()
        ]);
        
        // 处理监控数据
        if (monitorsResponse.success && monitorsResponse.monitors) {
          setMonitors(monitorsResponse.monitors);
        } else {
          console.error('获取监控数据失败:', monitorsResponse.message);
        }
        
        // 处理客户端数据
        if (agentsResponse.success && agentsResponse.agents) {
          console.log('获取到客户端列表:', agentsResponse.agents);
          setAgents(agentsResponse.agents);
        } else {
          console.error('获取客户端数据失败:', agentsResponse.message);
        }
      } catch (err) {
        console.error('获取数据错误:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // 设置定时器，每分钟刷新一次数据
    const intervalId = setInterval(() => {
      console.log('Dashboard: 自动刷新数据...');
      fetchData();
    }, 60000); // 60000ms = 1分钟
    
    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [t]);

  // 加载中显示
  if (loading) {
    return (
      <Box className="dashboard-container">
        <Container size="3">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Text size="3">{t('common.loading')}</Text>
          </Flex>
        </Container>
      </Box>
    );
  }

  // 错误显示
  if (error) {
    return (
      <Box className="dashboard-container">
        <Container size="3">
          <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
            <Flex direction="column" align="center" gap="3">
              <Text size="3" style={{ color: 'var(--red-9)' }}>{error}</Text>
              <Button variant="soft" onClick={() => window.location.reload()}>
                {t('dashboard.refresh')}
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
    );
  }

  // 准备API监控状态摘要数据
  const apiMonitorItems = [
    {
      icon: <CheckCircledIcon width="16" height="16" />,
      label: t('monitors.status.up'),
      value: monitors.filter(m => m.status === 'up').length,
      bgColor: 'var(--green-3)',
      iconColor: 'var(--green-9)'
    },
    {
      icon: <CrossCircledIcon width="16" height="16" />,
      label: t('monitors.status.down'),
      value: monitors.filter(m => m.status === 'down').length,
      bgColor: 'var(--red-3)',
      iconColor: 'var(--red-9)'
    },
    {
      icon: <ClockIcon width="16" height="16" />,
      label: t('dashboard.totalMonitors'),
      value: monitors.length,
      bgColor: 'var(--gray-3)',
      iconColor: 'var(--gray-9)'
    }
  ];

  // 准备客户端状态摘要数据
  const agentStatusItems = [
    {
      icon: <GlobeIcon width="16" height="16" />,
      label: t('agent.status.online'),
      value: agents.filter(a => a.status === 'active').length,
      bgColor: 'var(--green-3)',
      iconColor: 'var(--green-9)'
    },
    {
      icon: <ExclamationTriangleIcon width="16" height="16" />,
      label: t('agent.status.offline'),
      value: agents.filter(a => a.status === 'inactive').length,
      bgColor: 'var(--amber-3)',
      iconColor: 'var(--amber-9)'
    },
    {
      icon: <GlobeIcon width="16" height="16" />,
      label: t('dashboard.totalMonitors'),
      value: agents.length,
      bgColor: 'var(--gray-3)',
      iconColor: 'var(--gray-9)'
    }
  ];

  return (
    <Box className="dashboard-container">
      <Container size="3" py="5">
        <Box>
          {/* 状态摘要 */}
          <Box pb="6">
            <Heading size="6" mb="5">{t('dashboard.summary')}</Heading>
            
            <Flex gap="4" justify="between" direction={{ initial: 'column', sm: 'row' }} style={{ width: '100%' }}>
              {/* API监控状态摘要 */}
              <Box style={{ flex: 1 }}>
                <StatusSummaryCard title={t('navbar.apiMonitors')} items={apiMonitorItems} />
              </Box>
              
              {/* 客户端监控状态摘要 */}
              <Box style={{ flex: 1 }}>
                <StatusSummaryCard title={t('navbar.agentMonitors')} items={agentStatusItems} />
              </Box>
            </Flex>
          </Box>
          
          {/* API监控状态 */}
          <Box py="5">
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">{t('navbar.apiMonitors')}</Heading>
              <Button variant="soft" asChild>
                <Link to="/monitors">{t('monitors.title')}</Link>
              </Button>
            </Flex>
            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
              {monitors.slice(0, 3).map(monitor => (
                <MonitorCard key={monitor.id} monitor={monitor} />
              ))}
            </Grid>
          </Box>
          
          {/* 客户端状态 */}
          <Box py="5">
            <Flex justify="between" align="center" mb="4">
              <Heading size="5">{t('navbar.agentMonitors')}</Heading>
              <Button variant="soft" asChild>
                <Link to="/agents">{t('agents.title')}</Link>
              </Button>
            </Flex>
            <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
              {agents.slice(0, 3).map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 