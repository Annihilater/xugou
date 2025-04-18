import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, Text, Button, Avatar, DropdownMenu, Separator, Container } from '@radix-ui/themes';
import { ExitIcon, PersonIcon, PersonIcon as UserIcon, DashboardIcon, ChevronDownIcon, ActivityLogIcon, CubeIcon, PieChartIcon, BellIcon } from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import '../styles/components.css';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  
  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  return (
    <Box className={`navbar-wrapper ${isScrolled ? 'scrolled' : ''}`}>
      <Box className="navbar-container">
        <Container size="3">
          <Flex justify="between" align="center" py="2" className="navbar-content">
            {/* Logo 部分 */}
            <Link to="/" className="navbar-logo-link">
              <Flex align="center" gap="2">
                <Box className="navbar-logo">
                  <PieChartIcon width="20" height="20" />
                </Box>
                <Text size="4" weight="bold">XUGOU</Text>
              </Flex>
            </Link>
            
            {/* 导航链接 */}
            <Flex align="center" gap="2">
              {isAuthenticated ? (
                <>
                  <Flex className="navbar-links" align="center">
                    <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                      <Button variant="ghost" size="2" className="nav-button">
                        <DashboardIcon width="14" height="14" />
                        <Text ml="1" size="2">{t('navbar.dashboard')}</Text>
                      </Button>
                    </Link>
                    
                    <Link to="/monitors" className={`nav-link ${isActive('/monitors') ? 'active' : ''}`}>
                      <Button variant="ghost" size="2" className="nav-button">
                        <ActivityLogIcon width="14" height="14" />
                        <Text ml="1" size="2">{t('navbar.apiMonitors')}</Text>
                      </Button>
                    </Link>
                    
                    <Link to="/agents" className={`nav-link ${isActive('/agents') ? 'active' : ''}`}>
                      <Button variant="ghost" size="2" className="nav-button">
                        <CubeIcon width="14" height="14" />
                        <Text ml="1" size="2">{t('navbar.agentMonitors')}</Text>
                      </Button>
                    </Link>
                    
                    <Link to="/status/config" className={`nav-link ${isActive('/status/config') ? 'active' : ''}`}>
                      <Button variant="ghost" size="2" className="nav-button">
                        <PieChartIcon width="14" height="14" />
                        <Text ml="1" size="2">{t('navbar.statusPage')}</Text>
                      </Button>
                    </Link>
                    
                    <Link to="/notifications" className={`nav-link ${isActive('/notifications') ? 'active' : ''}`}>
                      <Button variant="ghost" size="2" className="nav-button">
                        <BellIcon width="14" height="14" />
                        <Text ml="1" size="2">{t('navbar.notifications')}</Text>
                      </Button>
                    </Link>
                  </Flex>
                  
                  <Separator orientation="vertical" mx="3" />
                  
                  {/* 语言选择器 */}
                  <LanguageSelector />
                  
                  <Separator orientation="vertical" mx="3" />
                  
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" className="user-menu-button">
                        <Flex align="center" gap="1">
                          <Avatar
                            size="1"
                            radius="full"
                            fallback={user?.username?.charAt(0).toUpperCase() || 'U'}
                            color="blue"
                          />
                          <Box display={{ initial: 'none', sm: 'block' }}>
                            <Text size="2">{user?.username}</Text>
                          </Box>
                          <ChevronDownIcon width="12" height="12" />
                        </Flex>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" className="user-dropdown">
                      <DropdownMenu.Label>
                        <Text size="1" color="gray">{t('navbar.loggedInAs')}</Text>
                        <Text size="2" weight="bold">{user?.username}</Text>
                      </DropdownMenu.Label>
                      
                      <DropdownMenu.Separator />
                      
                      {user?.role === 'admin' && (
                        <DropdownMenu.Item onClick={() => navigate('/users')}>
                          <Flex gap="2" align="center">
                            <UserIcon width="14" height="14" />
                            <Text size="2">{t('navbar.userManagement')}</Text>
                          </Flex>
                        </DropdownMenu.Item>
                      )}
                      
                      <DropdownMenu.Item onClick={() => navigate('/profile')}>
                        <Flex gap="2" align="center">
                          <PersonIcon width="14" height="14" />
                          <Text size="2">{t('navbar.profile')}</Text>
                        </Flex>
                      </DropdownMenu.Item>
                      
                      <DropdownMenu.Separator />
                      
                      <DropdownMenu.Item color="red" onClick={handleLogout}>
                        <Flex gap="2" align="center">
                          <ExitIcon width="14" height="14" />
                          <Text size="2">{t('navbar.logout')}</Text>
                        </Flex>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </>
              ) : (
                <Flex gap="2" align="center">
                  {/* 语言选择器 */}
                  <LanguageSelector />
                  
                  <Separator orientation="vertical" mx="2" />
                  
                  <Button variant="ghost" onClick={() => navigate('/login')} size="2">
                    {t('navbar.login')}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Navbar; 