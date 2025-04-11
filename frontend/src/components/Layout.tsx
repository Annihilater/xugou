import { ReactNode } from 'react';
import { Box, Flex, Text, Container, Theme, Separator } from '@radix-ui/themes';
import Navbar from './Navbar';
import '../styles/components.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRss } from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  
  return (
    <Theme appearance="light">
      <Flex direction="column" className="layout-container">
        {/* 顶部导航栏 */}
        <Navbar />
        
        {/* 主要内容 */}
        <Box className="main-content">
          {children}
        </Box>
        
        {/* 页脚 */}
        <Box className="footer">
          <Container>
            <Separator size="4" mb="4" color="gray" />
            <Flex justify="center" align="center" py="3" direction="column">
              <Text size="2" color="gray">{t('footer.copyright', { year: currentYear })}</Text>
              <Flex gap="3" mt="2">
                <a href="https://zaunist.com" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faRss} size="lg" className="footer-link-icon" />
                  <Text size="2">{t('footer.blog')}</Text>
                </a>
                <a href="https://www.youtube.com/@zaunist" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faYoutube} size="lg" className="footer-link-icon" />
                  <Text size="2">{t('footer.youtube')}</Text>
                </a>
                <a href="https://mail.mdzz.uk" target="_blank" rel="noopener noreferrer" className="footer-link">
                  <FontAwesomeIcon icon={faEnvelope} size="lg" className="footer-link-icon" />
                  <Text size="2">{t('footer.tempMail')}</Text>
                </a>
              </Flex>
            </Flex>
          </Container>
        </Box>
      </Flex>
    </Theme>
  );
};

export default Layout; 